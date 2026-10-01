import { and, asc, desc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import type { AppLocale } from "@/i18n/config";
import {
  areas,
  areaTranslations,
  categories,
  categoryTranslations,
  cities,
  cityTranslations,
  listingImages,
  listings,
  sellerProfiles,
  users,
} from "@/server/db/schema";
import type * as schema from "@/server/db/schema";

export async function selectOwnedListings(
  database: NodePgDatabase<typeof schema>,
  userId: string,
) {
  return database
    .select({
      id: listings.id,
      priceAmount: listings.priceAmount,
      slug: listings.slug,
      status: listings.status,
      title: listings.title,
      updatedAt: listings.updatedAt,
    })
    .from(listings)
    .innerJoin(sellerProfiles, eq(sellerProfiles.id, listings.sellerProfileId))
    .where(eq(sellerProfiles.userId, userId))
    .orderBy(desc(listings.updatedAt));
}

export async function selectOwnedListingForEdit(
  database: NodePgDatabase<typeof schema>,
  userId: string,
  listingId: string,
) {
  const [listing] = await database
    .select({
      areaId: listings.areaId,
      categoryId: listings.categoryId,
      cityId: listings.cityId,
      deliveryAvailable: listings.deliveryAvailable,
      description: listings.description,
      id: listings.id,
      pickupAvailable: listings.pickupAvailable,
      priceAmount: listings.priceAmount,
      slug: listings.slug,
      status: listings.status,
      title: listings.title,
    })
    .from(listings)
    .innerJoin(sellerProfiles, eq(sellerProfiles.id, listings.sellerProfileId))
    .where(and(eq(listings.id, listingId), eq(sellerProfiles.userId, userId)))
    .limit(1);
  if (!listing) return null;
  const images = await database
    .select({
      deliveryUrl: listingImages.deliveryUrl,
      id: listingImages.id,
      sortOrder: listingImages.sortOrder,
    })
    .from(listingImages)
    .where(eq(listingImages.listingId, listing.id))
    .orderBy(asc(listingImages.sortOrder));
  return { ...listing, images };
}

export async function selectPublicListingBySlug(
  database: NodePgDatabase<typeof schema>,
  locale: AppLocale,
  slug: string,
) {
  const [listing] = await database
    .select({
      areaName: areaTranslations.name,
      categoryName: categoryTranslations.name,
      categorySlug: categories.slug,
      cityName: cityTranslations.name,
      currencyCode: listings.currencyCode,
      deliveryAvailable: listings.deliveryAvailable,
      description: listings.description,
      id: listings.id,
      pickupAvailable: listings.pickupAvailable,
      priceAmount: listings.priceAmount,
      publishedAt: listings.publishedAt,
      sellerBio: sellerProfiles.bio,
      sellerDisplayName: sellerProfiles.displayName,
      sellerSlug: sellerProfiles.slug,
      slug: listings.slug,
      title: listings.title,
    })
    .from(listings)
    .innerJoin(sellerProfiles, eq(sellerProfiles.id, listings.sellerProfileId))
    .innerJoin(users, eq(users.id, sellerProfiles.userId))
    .innerJoin(categories, eq(categories.id, listings.categoryId))
    .innerJoin(
      categoryTranslations,
      and(
        eq(categoryTranslations.categoryId, categories.id),
        eq(categoryTranslations.locale, locale),
      ),
    )
    .innerJoin(cities, eq(cities.id, listings.cityId))
    .innerJoin(
      cityTranslations,
      and(
        eq(cityTranslations.cityId, cities.id),
        eq(cityTranslations.locale, locale),
      ),
    )
    .innerJoin(areas, eq(areas.id, listings.areaId))
    .leftJoin(
      areaTranslations,
      and(
        eq(areaTranslations.areaId, areas.id),
        eq(areaTranslations.locale, locale),
      ),
    )
    .where(
      and(
        eq(listings.slug, slug),
        eq(listings.status, "ACTIVE"),
        eq(sellerProfiles.status, "ACTIVE"),
        eq(users.status, "ACTIVE"),
        eq(categories.active, true),
        eq(cities.active, true),
        eq(areas.active, true),
      ),
    )
    .limit(1);
  if (!listing || !listing.priceAmount) return null;
  const images = await database
    .select({
      deliveryUrl: listingImages.deliveryUrl,
      id: listingImages.id,
      sortOrder: listingImages.sortOrder,
    })
    .from(listingImages)
    .where(eq(listingImages.listingId, listing.id))
    .orderBy(asc(listingImages.sortOrder));
  if (!images.length) return null;
  return {
    ...listing,
    images,
    location: listing.areaName ?? listing.cityName,
    priceAmount: listing.priceAmount,
  } as const;
}
