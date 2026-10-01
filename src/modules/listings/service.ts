import { and, asc, count, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { MarketplaceError } from "@/modules/marketplace/errors";
import { enforceMarketplaceRateLimit } from "@/modules/marketplace/rate-limit";
import {
  requireOwner,
  requireVerified,
  type Principal,
} from "@/server/authorization/policy";
import {
  areas,
  categories,
  cities,
  listingImages,
  listings,
  sellerProfiles,
} from "@/server/db/schema";
import type * as schema from "@/server/db/schema";

import { deleteOrQueueStorageKeys } from "../storage/cleanup";
import {
  processListingImage,
  MAX_IMAGE_COUNT,
} from "../storage/image-processing";
import { createStorageKey } from "../storage/keys";
import type { ImageStorage } from "../storage/types";
import { nextListingStatus, type ListingTransition } from "./lifecycle";
import { createStableSlug } from "./slug";
import type { ListingInput } from "./validation";

export type UploadedImageInput = Readonly<{
  buffer: Buffer;
  declaredMimeType: string;
}>;

type StoredImageMetadata = Readonly<{
  byteSize: number;
  deliveryUrl: string;
  height: number;
  mimeType: "image/webp";
  storageKey: string;
  width: number;
}>;

const declaredImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function createListing(
  database: NodePgDatabase<typeof schema>,
  storage: ImageStorage,
  principal: Principal | null,
  input: ListingInput,
  files: readonly UploadedImageInput[],
) {
  const actor = requireVerified(principal);
  const seller = await loadOwnedSeller(database, actor.userId);
  if (seller.status === "SUSPENDED") throw new MarketplaceError("UNAVAILABLE");
  await enforceMarketplaceRateLimit(database, {
    action: "listing-create",
    actorId: actor.userId,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  const dependencies = await loadActiveDependencies(database, input);
  const status = input.intent === "publish" ? "ACTIVE" : "DRAFT";
  if (status === "ACTIVE") {
    assertPublishable(input, files.length, seller.status, dependencies.area);
  }

  const stored = await prepareAndStoreImages(
    database,
    storage,
    actor.userId,
    files,
    0,
  );
  try {
    const listing = await database.transaction(async (transaction) => {
      const [created] = await transaction
        .insert(listings)
        .values({
          areaId: input.areaId,
          categoryId: input.categoryId,
          cityId: input.cityId,
          deliveryAvailable: input.deliveryAvailable,
          description: input.description,
          pickupAvailable: input.pickupAvailable,
          priceAmount: input.priceAmount,
          publicLatitude:
            status === "ACTIVE" ? dependencies.area?.latitude : null,
          publicLocationVersion:
            status === "ACTIVE" ? "area-centroid-v1" : null,
          publicLongitude:
            status === "ACTIVE" ? dependencies.area?.longitude : null,
          publishedAt: status === "ACTIVE" ? new Date() : null,
          sellerProfileId: seller.id,
          slug: createStableSlug(input.title, "listing"),
          status,
          title: input.title,
        })
        .returning({ id: listings.id, slug: listings.slug });
      if (!created) throw new MarketplaceError("UNAVAILABLE");
      if (stored.length) {
        await transaction.insert(listingImages).values(
          stored.map((image, sortOrder) => ({
            ...image,
            listingId: created.id,
            sortOrder,
          })),
        );
      }
      return created;
    });
    return listing;
  } catch (error) {
    await deleteOrQueueStorageKeys(
      database,
      storage,
      stored.map(({ storageKey }) => storageKey),
    );
    throw error;
  }
}

export async function updateListing(
  database: NodePgDatabase<typeof schema>,
  storage: ImageStorage,
  principal: Principal | null,
  listingId: string,
  input: ListingInput,
  files: readonly UploadedImageInput[],
  removeImageIds: readonly string[],
  orderedImageIds: readonly string[],
) {
  const actor = requireVerified(principal);
  const owned = await loadOwnedListing(database, listingId);
  requireOwner(actor, owned.userId);
  if (owned.sellerStatus === "SUSPENDED" || owned.status === "REMOVED") {
    throw new MarketplaceError("INVALID_STATE");
  }
  const dependencies = await loadActiveDependencies(database, input);
  const currentImages = await database
    .select()
    .from(listingImages)
    .where(eq(listingImages.listingId, listingId))
    .orderBy(asc(listingImages.sortOrder));
  const removeSet = new Set(removeImageIds);
  const retained = currentImages.filter((image) => !removeSet.has(image.id));
  const retainedById = new Map(retained.map((image) => [image.id, image]));
  const orderedRetained = orderedImageIds.length
    ? orderedImageIds
        .map((id) => retainedById.get(id))
        .filter((image) => image !== undefined)
    : retained;
  for (const image of retained) {
    if (!orderedRetained.some(({ id }) => id === image.id))
      orderedRetained.push(image);
  }
  if (orderedRetained.length + files.length > MAX_IMAGE_COUNT) {
    throw new MarketplaceError("VALIDATION");
  }

  const nextStatus =
    owned.status === "DRAFT" && input.intent === "publish"
      ? "ACTIVE"
      : owned.status;
  if (nextStatus === "ACTIVE" || nextStatus === "PAUSED") {
    assertPublishable(
      input,
      orderedRetained.length + files.length,
      owned.sellerStatus,
      dependencies.area,
    );
  }

  const uploaded = await prepareAndStoreImages(
    database,
    storage,
    actor.userId,
    files,
    orderedRetained.length,
  );

  try {
    await database.transaction(async (transaction) => {
      await transaction
        .delete(listingImages)
        .where(eq(listingImages.listingId, listingId));
      const allImages = [
        ...orderedRetained.map((image) => ({
          byteSize: image.byteSize,
          deliveryUrl: image.deliveryUrl,
          height: image.height,
          id: image.id,
          mimeType: image.mimeType,
          storageKey: image.storageKey,
          width: image.width,
        })),
        ...uploaded,
      ];
      if (allImages.length) {
        await transaction.insert(listingImages).values(
          allImages.map((image, sortOrder) => ({
            ...image,
            listingId,
            sortOrder,
          })),
        );
      }
      await transaction
        .update(listings)
        .set({
          areaId: input.areaId,
          categoryId: input.categoryId,
          cityId: input.cityId,
          deliveryAvailable: input.deliveryAvailable,
          description: input.description,
          pickupAvailable: input.pickupAvailable,
          priceAmount: input.priceAmount,
          publicLatitude:
            nextStatus === "ACTIVE" || nextStatus === "PAUSED"
              ? dependencies.area?.latitude
              : null,
          publicLocationVersion:
            nextStatus === "ACTIVE" || nextStatus === "PAUSED"
              ? "area-centroid-v1"
              : null,
          publicLongitude:
            nextStatus === "ACTIVE" || nextStatus === "PAUSED"
              ? dependencies.area?.longitude
              : null,
          publishedAt:
            owned.publishedAt ?? (nextStatus === "ACTIVE" ? new Date() : null),
          status: nextStatus,
          title: input.title,
          updatedAt: new Date(),
        })
        .where(eq(listings.id, listingId));
    });
  } catch (error) {
    await deleteOrQueueStorageKeys(
      database,
      storage,
      uploaded.map(({ storageKey }) => storageKey),
    );
    throw error;
  }

  const removedKeys = currentImages
    .filter((image) => removeSet.has(image.id))
    .map(({ storageKey }) => storageKey);
  await deleteOrQueueStorageKeys(database, storage, removedKeys);
  return { id: listingId, slug: owned.slug };
}

export async function transitionListing(
  database: NodePgDatabase<typeof schema>,
  principal: Principal | null,
  listingId: string,
  transition: ListingTransition,
) {
  const actor = requireVerified(principal);
  const owned = await loadOwnedListing(database, listingId);
  requireOwner(actor, owned.userId);
  const nextStatus = nextListingStatus(owned.status, transition);
  if (!nextStatus) throw new MarketplaceError("INVALID_STATE");

  if (nextStatus === "ACTIVE") {
    await enforceMarketplaceRateLimit(database, {
      action: "listing-publish",
      actorId: actor.userId,
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });
    const input: ListingInput = {
      areaId: owned.areaId,
      categoryId: owned.categoryId,
      cityId: owned.cityId,
      deliveryAvailable: owned.deliveryAvailable,
      description: owned.description,
      intent: "publish",
      pickupAvailable: owned.pickupAvailable,
      priceAmount: owned.priceAmount,
      title: owned.title,
    };
    const dependencies = await loadActiveDependencies(database, input);
    const [imageCount] = await database
      .select({ value: count() })
      .from(listingImages)
      .where(eq(listingImages.listingId, listingId));
    assertPublishable(
      input,
      imageCount?.value ?? 0,
      owned.sellerStatus,
      dependencies.area,
    );
    await database
      .update(listings)
      .set({
        publicLatitude: dependencies.area!.latitude,
        publicLocationVersion: "area-centroid-v1",
        publicLongitude: dependencies.area!.longitude,
        publishedAt: owned.publishedAt ?? new Date(),
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, listingId));
  } else {
    await database
      .update(listings)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(listings.id, listingId));
  }
  return nextStatus;
}

async function prepareAndStoreImages(
  database: NodePgDatabase<typeof schema>,
  storage: ImageStorage,
  actorId: string,
  files: readonly UploadedImageInput[],
  existingCount: number,
): Promise<StoredImageMetadata[]> {
  if (files.length + existingCount > MAX_IMAGE_COUNT)
    throw new MarketplaceError("VALIDATION");
  if (!files.length) return [];
  await enforceMarketplaceRateLimit(database, {
    action: "listing-upload",
    actorId,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  const stored: StoredImageMetadata[] = [];
  try {
    for (const file of files) {
      if (!declaredImageTypes.has(file.declaredMimeType))
        throw new MarketplaceError("VALIDATION");
      const processed = await processListingImage(
        file.buffer,
        file.declaredMimeType,
      );
      const storageKey = createStorageKey();
      const result = await storage.put({
        buffer: processed.buffer,
        storageKey,
      });
      stored.push({ ...processed, ...result });
    }
    return stored;
  } catch (error) {
    await deleteOrQueueStorageKeys(
      database,
      storage,
      stored.map(({ storageKey }) => storageKey),
    );
    throw error;
  }
}

async function loadOwnedSeller(
  database: NodePgDatabase<typeof schema>,
  userId: string,
) {
  const [seller] = await database
    .select({ id: sellerProfiles.id, status: sellerProfiles.status })
    .from(sellerProfiles)
    .where(eq(sellerProfiles.userId, userId))
    .limit(1);
  if (!seller) throw new MarketplaceError("NOT_FOUND");
  return seller;
}

async function loadOwnedListing(
  database: NodePgDatabase<typeof schema>,
  listingId: string,
) {
  const [listing] = await database
    .select({
      areaId: listings.areaId,
      categoryId: listings.categoryId,
      cityId: listings.cityId,
      deliveryAvailable: listings.deliveryAvailable,
      description: listings.description,
      pickupAvailable: listings.pickupAvailable,
      priceAmount: listings.priceAmount,
      publishedAt: listings.publishedAt,
      sellerStatus: sellerProfiles.status,
      slug: listings.slug,
      status: listings.status,
      title: listings.title,
      userId: sellerProfiles.userId,
    })
    .from(listings)
    .innerJoin(sellerProfiles, eq(sellerProfiles.id, listings.sellerProfileId))
    .where(eq(listings.id, listingId))
    .limit(1);
  if (!listing) throw new MarketplaceError("NOT_FOUND");
  return listing;
}

async function loadActiveDependencies(
  database: NodePgDatabase<typeof schema>,
  input: ListingInput,
) {
  const [[category], [city], [area]] = await Promise.all([
    database
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(eq(categories.id, input.categoryId), eq(categories.active, true)),
      )
      .limit(1),
    database
      .select({ id: cities.id })
      .from(cities)
      .where(and(eq(cities.id, input.cityId), eq(cities.active, true)))
      .limit(1),
    input.areaId
      ? database
          .select({
            id: areas.id,
            latitude: areas.latitude,
            longitude: areas.longitude,
          })
          .from(areas)
          .where(
            and(
              eq(areas.id, input.areaId),
              eq(areas.cityId, input.cityId),
              eq(areas.active, true),
            ),
          )
          .limit(1)
      : Promise.resolve([]),
  ]);
  if (!category || !city || (input.areaId && !area))
    throw new MarketplaceError("VALIDATION");
  return { area: area ?? null };
}

function assertPublishable(
  input: ListingInput,
  imageCount: number,
  sellerStatus: "ACTIVE" | "PAUSED" | "SUSPENDED",
  area: { latitude: string; longitude: string } | null,
) {
  if (
    sellerStatus !== "ACTIVE" ||
    !input.priceAmount ||
    !input.areaId ||
    !area ||
    (!input.pickupAvailable && !input.deliveryAvailable) ||
    imageCount < 1 ||
    imageCount > MAX_IMAGE_COUNT
  ) {
    throw new MarketplaceError("VALIDATION");
  }
}
