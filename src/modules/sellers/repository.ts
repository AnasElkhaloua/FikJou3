import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import type { AppLocale } from "@/i18n/config";
import {
  areas,
  areaTranslations,
  categories,
  cities,
  cityTranslations,
  listingImages,
  listings,
  sellerProfiles,
  users,
} from "@/server/db/schema";
import type * as schema from "@/server/db/schema";

export async function selectSellerForUser(
  database: NodePgDatabase<typeof schema>,
  userId: string,
) {
  const [seller] = await database
    .select({
      allowPhone: sellerProfiles.allowPhone,
      allowPlatformMessages: sellerProfiles.allowPlatformMessages,
      allowWhatsApp: sellerProfiles.allowWhatsApp,
      areaId: sellerProfiles.areaId,
      bio: sellerProfiles.bio,
      cityId: sellerProfiles.cityId,
      contactPhone: sellerProfiles.contactPhone,
      displayName: sellerProfiles.displayName,
      id: sellerProfiles.id,
      slug: sellerProfiles.slug,
      status: sellerProfiles.status,
    })
    .from(sellerProfiles)
    .where(eq(sellerProfiles.userId, userId))
    .limit(1);
  return seller ?? null;
}

export async function selectPublicSellerBySlug(
  database: NodePgDatabase<typeof schema>,
  locale: AppLocale,
  slug: string,
) {
  const [seller] = await database
    .select({
      areaName: areaTranslations.name,
      bio: sellerProfiles.bio,
      cityName: cityTranslations.name,
      createdAt: sellerProfiles.createdAt,
      displayName: sellerProfiles.displayName,
      id: sellerProfiles.id,
      slug: sellerProfiles.slug,
    })
    .from(sellerProfiles)
    .innerJoin(users, eq(users.id, sellerProfiles.userId))
    .innerJoin(cities, eq(cities.id, sellerProfiles.cityId))
    .innerJoin(
      cityTranslations,
      and(
        eq(cityTranslations.cityId, cities.id),
        eq(cityTranslations.locale, locale),
      ),
    )
    .leftJoin(areas, eq(areas.id, sellerProfiles.areaId))
    .leftJoin(
      areaTranslations,
      and(
        eq(areaTranslations.areaId, areas.id),
        eq(areaTranslations.locale, locale),
      ),
    )
    .where(
      and(
        eq(sellerProfiles.slug, slug),
        eq(sellerProfiles.status, "ACTIVE"),
        eq(users.status, "ACTIVE"),
        eq(cities.active, true),
        or(isNull(sellerProfiles.areaId), eq(areas.active, true)),
      ),
    )
    .limit(1);
  if (!seller) return null;

  const listingRows = await database
    .select({
      areaName: areaTranslations.name,
      categorySlug: categories.slug,
      cityName: cityTranslations.name,
      deliveryAvailable: listings.deliveryAvailable,
      id: listings.id,
      priceAmount: listings.priceAmount,
      pickupAvailable: listings.pickupAvailable,
      slug: listings.slug,
      title: listings.title,
    })
    .from(listings)
    .innerJoin(categories, eq(categories.id, listings.categoryId))
    .innerJoin(cities, eq(cities.id, listings.cityId))
    .innerJoin(
      cityTranslations,
      and(
        eq(cityTranslations.cityId, cities.id),
        eq(cityTranslations.locale, locale),
      ),
    )
    .innerJoin(areas, eq(areas.id, listings.areaId))
    .innerJoin(
      areaTranslations,
      and(
        eq(areaTranslations.areaId, areas.id),
        eq(areaTranslations.locale, locale),
      ),
    )
    .where(
      and(
        eq(listings.sellerProfileId, seller.id),
        eq(listings.status, "ACTIVE"),
        eq(categories.active, true),
        eq(cities.active, true),
        eq(areas.active, true),
      ),
    )
    .orderBy(asc(listings.publishedAt));
  const ids = listingRows.map(({ id }) => id);
  const images = ids.length
    ? await database
        .select({
          deliveryUrl: listingImages.deliveryUrl,
          listingId: listingImages.listingId,
        })
        .from(listingImages)
        .where(
          and(
            inArray(listingImages.listingId, ids),
            eq(listingImages.sortOrder, 0),
          ),
        )
    : [];
  const coverByListing = new Map(
    images.map((image) => [image.listingId, image.deliveryUrl]),
  );

  return {
    ...seller,
    listings: listingRows.map((listing) => ({
      ...listing,
      coverUrl: coverByListing.get(listing.id) ?? null,
      location: listing.areaName ?? listing.cityName,
    })),
  };
}
