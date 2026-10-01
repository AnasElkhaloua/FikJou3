import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  lte,
  sql,
  type SQL,
} from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import type { ListingCardView } from "@/components/marketplace/listing-card-types";
import type { AppLocale } from "@/i18n/config";
import { publicListingEligibilityConditions } from "@/modules/listings/public-eligibility";
import {
  areas,
  areaTranslations,
  categories,
  categoryTranslations,
  cities,
  cityTranslations,
  countries,
  listingImages,
  listings,
  sellerProfiles,
  users,
} from "@/server/db/schema";
import type * as schema from "@/server/db/schema";

import {
  DISCOVERY_PAGE_SIZE,
  type DiscoveryInput,
  type DiscoveryIssue,
} from "./params";

export type DiscoveryResult = Readonly<{
  input: DiscoveryInput;
  issues: readonly DiscoveryIssue[];
  listings: readonly ListingCardView[];
  pageCount: number;
  total: number;
}>;

async function resolveFilters(
  database: NodePgDatabase<typeof schema>,
  input: DiscoveryInput,
) {
  const issues: DiscoveryIssue[] = [];
  let cityId: string | null = null;
  let areaId: string | null = null;
  let categoryId: string | null = null;
  let normalized = input;

  if (input.city) {
    const [city] = await database
      .select({ id: cities.id })
      .from(cities)
      .innerJoin(countries, eq(countries.id, cities.countryId))
      .where(
        and(
          eq(cities.slug, input.city),
          eq(cities.active, true),
          eq(countries.code, "MA"),
          eq(countries.active, true),
        ),
      )
      .limit(1);
    if (city) cityId = city.id;
    else {
      issues.push("invalid-city");
      normalized = { ...normalized, area: null, city: null };
    }
  }

  if (normalized.area && cityId) {
    const [area] = await database
      .select({ id: areas.id })
      .from(areas)
      .where(
        and(
          eq(areas.slug, normalized.area),
          eq(areas.cityId, cityId),
          eq(areas.active, true),
        ),
      )
      .limit(1);
    if (area) areaId = area.id;
    else {
      issues.push("invalid-area");
      normalized = { ...normalized, area: null };
    }
  }

  if (input.category) {
    const [category] = await database
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(eq(categories.slug, input.category), eq(categories.active, true)),
      )
      .limit(1);
    if (category) categoryId = category.id;
    else {
      issues.push("invalid-category");
      normalized = { ...normalized, category: null };
    }
  }

  return { areaId, categoryId, cityId, issues, normalized };
}

export async function selectDiscoveryListings(
  database: NodePgDatabase<typeof schema>,
  locale: AppLocale,
  requestedInput: DiscoveryInput,
): Promise<DiscoveryResult> {
  const resolved = await resolveFilters(database, requestedInput);
  const input = resolved.normalized;
  const conditions: SQL[] = [...publicListingEligibilityConditions()];
  if (resolved.cityId) conditions.push(eq(listings.cityId, resolved.cityId));
  if (resolved.areaId) conditions.push(eq(listings.areaId, resolved.areaId));
  if (resolved.categoryId)
    conditions.push(eq(listings.categoryId, resolved.categoryId));
  if (input.minPrice)
    conditions.push(gte(listings.priceAmount, input.minPrice));
  if (input.maxPrice)
    conditions.push(lte(listings.priceAmount, input.maxPrice));
  if (input.pickup) conditions.push(eq(listings.pickupAvailable, true));
  if (input.delivery) conditions.push(eq(listings.deliveryAvailable, true));

  if (input.query) {
    const searchQuery = sql`websearch_to_tsquery('simple', ${input.query})`;
    conditions.push(sql`(
      ${listings.searchVector} @@ ${searchQuery}
      or to_tsvector('simple', ${sellerProfiles.displayName}) @@ ${searchQuery}
      or to_tsvector('simple', ${categoryTranslations.name}) @@ ${searchQuery}
      or exists (
        select 1
        from listing_tags discovery_listing_tags
        inner join tags discovery_tags
          on discovery_tags.id = discovery_listing_tags.tag_id
          and discovery_tags.active = true
        inner join tag_translations discovery_tag_translations
          on discovery_tag_translations.tag_id = discovery_tags.id
          and discovery_tag_translations.locale = ${locale}
        where discovery_listing_tags.listing_id = ${listings.id}
          and to_tsvector('simple', discovery_tag_translations.name) @@ ${searchQuery}
      )
    )`);
  }

  const order =
    input.sort === "price-asc"
      ? [asc(listings.priceAmount), asc(listings.id)]
      : input.sort === "price-desc"
        ? [desc(listings.priceAmount), asc(listings.id)]
        : [desc(listings.publishedAt), desc(listings.id)];

  const countRows = await database
    .select({ total: count() })
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
    .innerJoin(countries, eq(countries.id, cities.countryId))
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
    .innerJoin(
      listingImages,
      and(
        eq(listingImages.listingId, listings.id),
        eq(listingImages.sortOrder, 0),
      ),
    )
    .where(and(...conditions));
  const total = countRows[0]?.total ?? 0;
  const pageCount = Math.ceil(total / DISCOVERY_PAGE_SIZE);
  const effectivePage = Math.min(input.page, Math.max(pageCount, 1));

  const rows = await database
    .select({
      areaName: areaTranslations.name,
      categorySlug: categories.slug,
      coverUrl: listingImages.deliveryUrl,
      deliveryAvailable: listings.deliveryAvailable,
      id: listings.id,
      pickupAvailable: listings.pickupAvailable,
      priceAmount: listings.priceAmount,
      sellerName: sellerProfiles.displayName,
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
    .innerJoin(countries, eq(countries.id, cities.countryId))
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
    .innerJoin(
      listingImages,
      and(
        eq(listingImages.listingId, listings.id),
        eq(listingImages.sortOrder, 0),
      ),
    )
    .where(and(...conditions))
    .orderBy(...order)
    .limit(DISCOVERY_PAGE_SIZE)
    .offset((effectivePage - 1) * DISCOVERY_PAGE_SIZE);

  return {
    input: { ...input, page: effectivePage },
    issues: resolved.issues,
    listings: rows.map((row) => ({
      categorySlug: row.categorySlug,
      fulfillment: [
        ...(row.pickupAvailable ? (["pickup"] as const) : []),
        ...(row.deliveryAvailable ? (["delivery"] as const) : []),
      ],
      href: `/listing/${row.slug}`,
      id: row.id,
      image: row.coverUrl
        ? { alt: row.title, position: "center" as const, src: row.coverUrl }
        : null,
      location: row.areaName,
      priceAmount: row.priceAmount!,
      rating: null,
      reviewCount: 0,
      sellerName: row.sellerName,
      title: row.title,
    })),
    pageCount,
    total,
  };
}
