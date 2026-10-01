import { and, eq, or } from "drizzle-orm";

import { serverEnv } from "@/env/server";
import { isStorageKey } from "@/modules/storage/keys";
import { LocalStorageAdapter } from "@/modules/storage/local-adapter";
import { loadSessionPrincipal } from "@/server/authorization/session";
import { db } from "@/server/db/client";
import {
  listingImages,
  listings,
  areas,
  categories,
  cities,
  sellerProfiles,
  users,
} from "@/server/db/schema";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  if (serverEnv.STORAGE_DRIVER !== "local" || !isStorageKey(key)) {
    return new Response("Not found", { status: 404 });
  }
  const principal = await loadSessionPrincipal();
  const ownerCondition =
    principal?.status === "ACTIVE" && principal.emailVerified
      ? eq(sellerProfiles.userId, principal.userId)
      : undefined;
  const [image] = await db
    .select({
      ownerUserId: sellerProfiles.userId,
      publicStatus: listings.status,
      areaActive: areas.active,
      categoryActive: categories.active,
      cityActive: cities.active,
      sellerStatus: sellerProfiles.status,
      userStatus: users.status,
    })
    .from(listingImages)
    .innerJoin(listings, eq(listings.id, listingImages.listingId))
    .innerJoin(sellerProfiles, eq(sellerProfiles.id, listings.sellerProfileId))
    .innerJoin(users, eq(users.id, sellerProfiles.userId))
    .innerJoin(categories, eq(categories.id, listings.categoryId))
    .innerJoin(cities, eq(cities.id, listings.cityId))
    .innerJoin(areas, eq(areas.id, listings.areaId))
    .where(
      and(
        eq(listingImages.storageKey, key),
        or(
          and(
            eq(listings.status, "ACTIVE"),
            eq(sellerProfiles.status, "ACTIVE"),
            eq(users.status, "ACTIVE"),
            eq(categories.active, true),
            eq(cities.active, true),
            eq(areas.active, true),
          ),
          ownerCondition,
        ),
      ),
    )
    .limit(1);
  if (!image) return new Response("Not found", { status: 404 });

  try {
    const buffer = await new LocalStorageAdapter(
      serverEnv.LOCAL_UPLOAD_DIR,
    ).read(key);
    return new Response(Uint8Array.from(buffer), {
      headers: {
        "cache-control":
          image.publicStatus === "ACTIVE" &&
          image.sellerStatus === "ACTIVE" &&
          image.userStatus === "ACTIVE" &&
          image.areaActive &&
          image.categoryActive &&
          image.cityActive
            ? "public, max-age=3600"
            : "private, no-store",
        "content-type": "image/webp",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
