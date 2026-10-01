import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { PostgresInstance } from "pg-embedded";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { parseDiscoveryParams } from "../../src/modules/discovery/params";
import { selectDiscoveryListings } from "../../src/modules/discovery/repository";
import * as schema from "../../src/server/db/schema";
import { seedReferenceData } from "../../src/server/db/seed";
import {
  areaSeeds,
  categorySeeds,
  citySeeds,
} from "../../src/server/db/seed-data";

const ACTIVE_USER_ID = "61000000-0000-4000-8000-000000000001";
const SUSPENDED_USER_ID = "61000000-0000-4000-8000-000000000002";
const ACTIVE_SELLER_ID = "62000000-0000-4000-8000-000000000001";
const SUSPENDED_SELLER_ID = "62000000-0000-4000-8000-000000000002";
const CASABLANCA_ID = citySeeds[0].id;
const RABAT_ID = citySeeds[1].id;
const MAARIF_ID = areaSeeds[0][0];
const AGDAL_ID = areaSeeds[2][0];
const MOROCCAN_ID = categorySeeds[0][0];
const DESSERTS_ID = categorySeeds[2][0];

describe("Phase 04 discovery repository", () => {
  let postgres: PostgresInstance;
  let pool: Pool;
  let database: ReturnType<typeof drizzle<typeof schema>>;

  beforeAll(async () => {
    postgres = new PostgresInstance({
      databaseName: "postgres",
      persistent: false,
      port: 0,
      setupTimeout: 150,
      timeout: 60,
    });
    await postgres.start();
    pool = new Pool({
      connectionString: postgres.connectionInfo.connectionString,
    });
    database = drizzle(pool, { schema });
    await migrate(database, { migrationsFolder: "drizzle" });
    await seedReferenceData(database);
    await seedDiscoveryFixtures(database);
  });

  afterAll(async () => {
    if (pool) await pool.end();
    if (postgres) {
      await postgres.stop();
      await postgres.cleanup();
    }
  });

  const search = (
    params: Record<string, string> = {},
    locale: "en" | "fr" = "en",
  ) =>
    selectDiscoveryListings(
      database,
      locale,
      parseDiscoveryParams(params).input,
    );

  it("returns only fully eligible active public listings", async () => {
    const result = await search();
    expect(result.total).toBe(16);
    const slugs = result.listings.map(({ href }) => href);
    expect(slugs).not.toEqual(
      expect.arrayContaining([
        "/listing/draft-hidden",
        "/listing/paused-hidden",
        "/listing/removed-hidden",
        "/listing/suspended-seller-hidden",
        "/listing/suspended-user-hidden",
      ]),
    );
  });

  it("searches authored title/description, seller, category, tags, and Unicode", async () => {
    await expect(search({ q: "couscous" })).resolves.toMatchObject({
      total: 1,
    });
    await expect(search({ q: "family saffron" })).resolves.toMatchObject({
      total: 1,
    });
    await expect(search({ q: "Atlas Kitchen" })).resolves.toMatchObject({
      total: 16,
    });
    await expect(search({ q: "Desserts" })).resolves.toMatchObject({
      total: 2,
    });
    await expect(search({ q: "Vegetarian" })).resolves.toMatchObject({
      total: 1,
    });
    const arabic = await search({ q: "كيك" });
    expect(arabic.total).toBe(1);
    expect(arabic.listings[0]?.title).toContain("كيك");
    await expect(search({ q: "Crème" })).resolves.toMatchObject({ total: 1 });
  });

  it("composes category, city, area, price, pickup, and delivery filters", async () => {
    const result = await search({
      area: "maarif",
      category: "desserts",
      city: "casablanca",
      delivery: "1",
      max: "100",
      min: "20",
    });
    expect(result.total).toBe(1);
    expect(
      result.listings.every(({ categorySlug }) => categorySlug === "desserts"),
    ).toBe(true);
    expect((await search({ pickup: "1" })).total).toBe(15);
    expect((await search({ delivery: "1" })).total).toBe(3);
  });

  it("rejects cross-city areas and inactive stable slugs without misleading results", async () => {
    const crossCity = await search({ area: "agdal", city: "casablanca" });
    expect(crossCity.input.area).toBeNull();
    expect(crossCity.issues).toContain("invalid-area");
    const unknown = await search({ category: "not-real", city: "not-real" });
    expect(unknown.input).toMatchObject({ category: null, city: null });
    expect(unknown.issues).toEqual(
      expect.arrayContaining(["invalid-category", "invalid-city"]),
    );
  });

  it("uses decimal PostgreSQL comparisons and deterministic sorts", async () => {
    const range = await search({ max: "30.50", min: "20.25" });
    expect(range.listings.map(({ priceAmount }) => priceAmount)).toEqual(
      expect.arrayContaining(["30.50", "25.25"]),
    );
    expect(
      range.listings.every(
        ({ priceAmount }) => priceAmount >= "20.25" && priceAmount <= "30.50",
      ),
    ).toBe(true);

    const ascending = await search({ sort: "price-asc" });
    expect(ascending.listings[0]?.priceAmount).toBe("11.00");
    expect(ascending.listings.slice(0, 2).map(({ id }) => id)).toEqual([
      "63000000-0000-4000-8000-000000000001",
      "63000000-0000-4000-8000-000000000002",
    ]);
    const descending = await search({ sort: "price-desc" });
    expect(descending.listings[0]?.priceAmount).toBe("60.00");
  });

  it("paginates a stable result set without duplicates or omissions", async () => {
    const first = await search({ page: "1" });
    const second = await search({ page: "2" });
    expect(first.listings).toHaveLength(12);
    expect(second.listings).toHaveLength(4);
    const ids = [...first.listings, ...second.listings].map(({ id }) => id);
    expect(new Set(ids).size).toBe(16);
  });

  it("returns an allow-listed DTO and localized labels without private fields", async () => {
    const english = await search({ q: "couscous" }, "en");
    const french = await search({ q: "couscous" }, "fr");
    expect(english.listings[0]).toMatchObject({
      id: french.listings[0]?.id,
      sellerName: french.listings[0]?.sellerName,
      title: french.listings[0]?.title,
    });
    expect(english.listings[0]?.location).toBe("Maarif");
    expect(french.listings[0]?.location).toBe("Maârif");
    expect(Object.keys(english.listings[0] ?? {}).sort()).toEqual([
      "categorySlug",
      "fulfillment",
      "href",
      "id",
      "image",
      "location",
      "priceAmount",
      "rating",
      "reviewCount",
      "sellerName",
      "title",
    ]);
    expect(JSON.stringify(english)).not.toContain("privateLatitude");
    expect(JSON.stringify(english)).not.toContain("phase04@example.test");
    expect(JSON.stringify(english)).not.toContain("storageKey");
  });

  it("parameterizes hostile search input and has the selected search/filter indexes", async () => {
    await expect(
      search({ q: "couscous'); drop table listings; --" }),
    ).resolves.toMatchObject({ total: 0 });
    expect(
      (await database.select({ id: schema.listings.id }).from(schema.listings))
        .length,
    ).toBeGreaterThan(0);
    const indexes = await database.execute<{ indexname: string }>(sql`
      select indexname from pg_indexes where tablename = 'listings'
    `);
    expect(indexes.rows.map(({ indexname }) => indexname)).toEqual(
      expect.arrayContaining([
        "listings_search_vector_idx",
        "listings_status_published_id_idx",
        "listings_published_at_idx",
        "listings_category_status_idx",
        "listings_city_area_status_idx",
        "listings_price_idx",
      ]),
    );
    const planText = await database.transaction(async (transaction) => {
      await transaction.execute(sql`set local enable_seqscan = off`);
      const plans = [
        await transaction.execute<{ "QUERY PLAN": string }>(sql`
        explain (analyze, buffers) select id from listings
        where status = 'ACTIVE' order by published_at desc, id desc limit 12
      `),
        await transaction.execute<{ "QUERY PLAN": string }>(sql`
        explain (analyze, buffers) select id from listings
        where category_id = ${DESSERTS_ID} and city_id = ${CASABLANCA_ID}
      `),
        await transaction.execute<{ "QUERY PLAN": string }>(sql`
        explain (analyze, buffers) select id from listings
        where price_amount between 20 and 50
      `),
        await transaction.execute<{ "QUERY PLAN": string }>(sql`
        explain (analyze, buffers) select id from listings
        where search_vector @@ websearch_to_tsquery('simple', 'couscous')
      `),
      ];
      return plans.map((plan) =>
        plan.rows.map((row) => row["QUERY PLAN"]).join("\n"),
      );
    });
    expect(planText[0]).toContain("listings_status_published_id_idx");
    expect(planText[1]).toMatch(
      /listings_(?:category_status|city_area_status)_idx/u,
    );
    expect(planText[2]).toContain("listings_price_idx");
    expect(planText[3]).toContain("listings_search_vector_idx");
  });
});

async function seedDiscoveryFixtures(
  database: ReturnType<typeof drizzle<typeof schema>>,
) {
  await database.insert(schema.users).values([
    {
      email: "phase04@example.test",
      emailVerified: true,
      id: ACTIVE_USER_ID,
      name: "Discovery Owner",
    },
    {
      email: "phase04-suspended@example.test",
      emailVerified: true,
      id: SUSPENDED_USER_ID,
      name: "Suspended",
      status: "SUSPENDED",
    },
  ]);
  await database.insert(schema.sellerProfiles).values([
    {
      areaId: MAARIF_ID,
      cityId: CASABLANCA_ID,
      displayName: "Atlas Kitchen",
      id: ACTIVE_SELLER_ID,
      slug: "atlas-kitchen",
      userId: ACTIVE_USER_ID,
    },
    {
      areaId: MAARIF_ID,
      cityId: CASABLANCA_ID,
      displayName: "Paused Kitchen",
      id: SUSPENDED_SELLER_ID,
      slug: "paused-kitchen",
      status: "SUSPENDED",
      userId: SUSPENDED_USER_ID,
    },
  ]);
  const now = new Date("2026-09-30T12:00:00.000Z");
  const active = Array.from({ length: 16 }, (_, index) => ({
    areaId: index === 15 ? AGDAL_ID : MAARIF_ID,
    categoryId: index === 1 || index === 2 ? DESSERTS_ID : MOROCCAN_ID,
    cityId: index === 15 ? RABAT_ID : CASABLANCA_ID,
    deliveryAvailable: index === 1 || index === 2 || index === 15,
    description:
      index === 3
        ? "A family saffron recipe prepared today"
        : "Homemade Moroccan food",
    id: `63000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    pickupAvailable: index !== 15,
    priceAmount:
      index < 2
        ? "11.00"
        : index === 2
          ? "25.25"
          : index === 3
            ? "30.50"
            : index === 4
              ? "60.00"
              : `${20 + index}.00`,
    publicLatitude: index === 15 ? "33.991000" : "33.583000",
    publicLocationVersion: "area-centroid-v1",
    publicLongitude: index === 15 ? "-6.849000" : "-7.632000",
    publishedAt: new Date(now.getTime() - index * 60_000),
    sellerProfileId: ACTIVE_SELLER_ID,
    slug:
      index === 0
        ? "couscous-seven-vegetables"
        : index === 1
          ? "كيك-بالليمون"
          : index === 2
            ? "creme-caramel"
            : `discovery-listing-${index + 1}`,
    status: "ACTIVE" as const,
    title:
      index === 0
        ? "Couscous seven vegetables"
        : index === 1
          ? "كيك بالليمون"
          : index === 2
            ? "Crème caramel"
            : `Discovery dish ${index + 1}`,
  }));
  await database.insert(schema.listings).values([
    ...active,
    ...(["DRAFT", "PAUSED", "REMOVED"] as const).map((status, index) => ({
      ...active[5]!,
      id: `64000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      publishedAt: status === "DRAFT" ? null : now,
      slug: `${status.toLowerCase()}-hidden`,
      status,
    })),
    {
      ...active[5]!,
      id: "64000000-0000-4000-8000-000000000004",
      sellerProfileId: SUSPENDED_SELLER_ID,
      slug: "suspended-seller-hidden",
    },
    {
      ...active[5]!,
      id: "64000000-0000-4000-8000-000000000005",
      sellerProfileId: SUSPENDED_SELLER_ID,
      slug: "suspended-user-hidden",
    },
  ]);
  const allListings = await database
    .select({ id: schema.listings.id })
    .from(schema.listings);
  await database.insert(schema.listingImages).values(
    allListings.map(({ id }, index) => ({
      byteSize: 100,
      deliveryUrl: `/api/media/phase04-${index}.webp`,
      height: 480,
      listingId: id,
      mimeType: "image/webp",
      sortOrder: 0,
      storageKey: `phase04-${index}.webp`,
      width: 640,
    })),
  );
  const tagId = "65000000-0000-4000-8000-000000000001";
  await database.insert(schema.tags).values({ id: tagId, slug: "vegetarian" });
  await database.insert(schema.tagTranslations).values([
    { locale: "en", name: "Vegetarian", tagId },
    { locale: "fr", name: "Végétarien", tagId },
  ]);
  await database
    .insert(schema.listingTags)
    .values({ listingId: active[0]!.id, tagId });
}
