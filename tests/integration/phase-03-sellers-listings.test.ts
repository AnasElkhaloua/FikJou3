import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { PostgresInstance } from "pg-embedded";
import { Pool } from "pg";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  selectOwnedListingForEdit,
  selectPublicListingBySlug,
} from "../../src/modules/listings/repository";
import {
  createListing,
  transitionListing,
  updateListing,
} from "../../src/modules/listings/service";
import { listingInputSchema } from "../../src/modules/listings/validation";
import { MarketplaceError } from "../../src/modules/marketplace/errors";
import {
  selectPublicSellerBySlug,
  selectSellerForUser,
} from "../../src/modules/sellers/repository";
import {
  createSellerProfile,
  updateSellerProfile,
} from "../../src/modules/sellers/service";
import type {
  ImageStorage,
  PutImageInput,
} from "../../src/modules/storage/types";
import type { Principal } from "../../src/server/authorization/policy";
import * as schema from "../../src/server/db/schema";
import { seedReferenceData } from "../../src/server/db/seed";
import {
  areaSeeds,
  categorySeeds,
  citySeeds,
} from "../../src/server/db/seed-data";

const CITY_ID = citySeeds[0].id;
const AREA_ID = areaSeeds[0][0];
const CATEGORY_ID = categorySeeds[0][0];

class MemoryStorage implements ImageStorage {
  readonly content = new Map<string, Buffer>();
  readonly deleted: string[] = [];
  failDelete = false;
  failPutAfter: number | null = null;
  returnedKey: string | null = null;

  async put(input: PutImageInput) {
    if (this.failPutAfter === 0) throw new Error("provider unavailable");
    if (this.failPutAfter !== null) this.failPutAfter -= 1;
    const storageKey = this.returnedKey ?? input.storageKey;
    this.content.set(storageKey, input.buffer);
    return {
      deliveryUrl: `/api/media/${storageKey}`,
      storageKey,
    };
  }

  async delete(storageKey: string) {
    if (this.failDelete) throw new Error("provider unavailable");
    this.content.delete(storageKey);
    this.deleted.push(storageKey);
  }
}

describe("Phase 03 seller and listing domain", () => {
  let postgres: PostgresInstance;
  let pool: Pool;
  let database: ReturnType<typeof drizzle<typeof schema>>;
  let image: Buffer;
  const ownerId = "50000000-0000-4000-8000-000000000001";
  const otherId = "50000000-0000-4000-8000-000000000002";
  const owner = principal(ownerId);
  const other = principal(otherId);
  const cityId = CITY_ID;
  const areaId = AREA_ID;
  const categoryId = CATEGORY_ID;

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
    await database.insert(schema.users).values([
      {
        email: "seller-one@example.test",
        emailVerified: true,
        id: ownerId,
        name: "Seller One",
      },
      {
        email: "seller-two@example.test",
        emailVerified: true,
        id: otherId,
        name: "Seller Two",
      },
    ]);
    image = await sharp({
      create: {
        background: { alpha: 1, b: 40, g: 120, r: 220 },
        channels: 4,
        height: 480,
        width: 640,
      },
    })
      .jpeg()
      .toBuffer();
  });

  afterAll(async () => {
    if (pool) await pool.end();
    if (postgres) {
      await postgres.stop();
      await postgres.cleanup();
    }
  });

  it("creates one Unicode seller profile per user with stable private management data", async () => {
    const seller = await createSellerProfile(
      database,
      owner,
      sellerInput("مطبخ أمينة"),
    );
    expect(seller.slug).toMatch(/^مطبخ-امينة-[0-9a-f]{8}$/u);
    await expect(
      createSellerProfile(database, owner, sellerInput("Another kitchen")),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const managed = await selectSellerForUser(database, ownerId);
    expect(managed).toMatchObject({
      contactPhone: "+212 600000000",
      displayName: "مطبخ أمينة",
    });
    await expect(
      updateSellerProfile(database, other, seller.id, sellerInput("Intruder")),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps incomplete drafts nullable while rejecting zero and negative prices in app and PostgreSQL", async () => {
    expect(
      listingInputSchema.safeParse(listingInput("0.00", "draft")).success,
    ).toBe(false);
    expect(
      listingInputSchema.safeParse(listingInput("-1.00", "draft")).success,
    ).toBe(false);
    expect(
      listingInputSchema.safeParse(listingInput("0.001", "draft")).success,
    ).toBe(false);
    expect(
      listingInputSchema.safeParse(listingInput("0.01", "draft")).success,
    ).toBe(true);

    const storage = new MemoryStorage();
    const draft = await createListing(
      database,
      storage,
      owner,
      listingInput(null, "draft"),
      [],
    );
    const [draftRow] = await database
      .select({
        priceAmount: schema.listings.priceAmount,
        status: schema.listings.status,
      })
      .from(schema.listings)
      .where(eq(schema.listings.id, draft.id));
    expect(draftRow).toEqual({ priceAmount: null, status: "DRAFT" });

    for (const priceAmount of ["0.00", "-0.01"]) {
      await expect(
        database.insert(schema.listings).values({
          categoryId,
          cityId,
          priceAmount,
          sellerProfileId: (await selectSellerForUser(database, ownerId))!.id,
          slug: `invalid-${priceAmount}`,
          title: "Invalid price",
        }),
      ).rejects.toMatchObject({ cause: { code: "23514" } });
    }
  });

  it("publishes with transformed images, preserves decimal strings, and exposes allow-listed public DTOs", async () => {
    const storage = new MemoryStorage();
    const created = await createListing(
      database,
      storage,
      owner,
      listingInput("12.30", "publish"),
      [{ buffer: image, declaredMimeType: "image/jpeg" }],
    );
    const publicListing = await selectPublicListingBySlug(
      database,
      "fr",
      created.slug,
    );
    expect(publicListing).toMatchObject({
      categorySlug: "moroccan",
      currencyCode: "MAD",
      priceAmount: "12.30",
      title: "Rfissa maison بالدجاج",
    });
    expect(publicListing?.images).toHaveLength(1);
    expect(Object.keys(publicListing ?? {})).not.toContain("contactPhone");
    expect(Object.keys(publicListing ?? {})).not.toContain("publicLatitude");
    expect(Object.keys(publicListing?.images[0] ?? {})).not.toContain(
      "storageKey",
    );

    const stored = [...storage.content.values()][0];
    expect((await sharp(stored).metadata()).format).toBe("webp");
    const seller = await selectSellerForUser(database, ownerId);
    const publicSeller = await selectPublicSellerBySlug(
      database,
      "en",
      seller!.slug,
    );
    expect(publicSeller?.listings.map(({ slug }) => slug)).toContain(
      created.slug,
    );
    expect(Object.keys(publicSeller ?? {})).not.toContain("contactPhone");
  });

  it("enforces ownership and the complete legal lifecycle", async () => {
    const storage = new MemoryStorage();
    const created = await createListing(
      database,
      storage,
      owner,
      listingInput("99.99", "publish"),
      [{ buffer: image, declaredMimeType: "image/jpeg" }],
    );
    await expect(
      transitionListing(database, other, created.id, "pause"),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      updateListing(
        database,
        storage,
        other,
        created.id,
        listingInput("99.99", "draft"),
        [],
        [],
        [],
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(
      await selectOwnedListingForEdit(database, otherId, created.id),
    ).toBeNull();

    expect(await transitionListing(database, owner, created.id, "pause")).toBe(
      "PAUSED",
    );
    expect(
      await selectPublicListingBySlug(database, "en", created.slug),
    ).toBeNull();
    expect(
      await transitionListing(database, owner, created.id, "reactivate"),
    ).toBe("ACTIVE");
    expect(await transitionListing(database, owner, created.id, "remove")).toBe(
      "REMOVED",
    );
    await expect(
      transitionListing(database, owner, created.id, "reactivate"),
    ).rejects.toBeInstanceOf(MarketplaceError);
  });

  it("rejects unauthenticated, unverified, and suspended mutation principals", async () => {
    const storage = new MemoryStorage();
    await expect(
      createListing(database, storage, null, listingInput(null, "draft"), []),
    ).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    await expect(
      createListing(
        database,
        storage,
        { ...owner, emailVerified: false },
        listingInput(null, "draft"),
        [],
      ),
    ).rejects.toMatchObject({ code: "EMAIL_UNVERIFIED" });
    await expect(
      createListing(
        database,
        storage,
        { ...owner, status: "SUSPENDED" },
        listingInput(null, "draft"),
        [],
      ),
    ).rejects.toMatchObject({ code: "ACCOUNT_UNAVAILABLE" });
  });

  it("preserves image order and records durable cleanup when provider deletion fails", async () => {
    const storage = new MemoryStorage();
    const draft = await createListing(
      database,
      storage,
      owner,
      { ...listingInput("8.00", "draft"), title: "Ordered images" },
      [
        { buffer: image, declaredMimeType: "image/jpeg" },
        { buffer: image, declaredMimeType: "image/jpeg" },
      ],
    );
    const before = await database
      .select({
        id: schema.listingImages.id,
        storageKey: schema.listingImages.storageKey,
      })
      .from(schema.listingImages)
      .where(eq(schema.listingImages.listingId, draft.id));
    storage.failDelete = true;
    await updateListing(
      database,
      storage,
      owner,
      draft.id,
      { ...listingInput("8.00", "draft"), title: "Ordered images" },
      [],
      [before[0]!.id],
      [before[1]!.id],
    );
    const cleanup = await database
      .select({ storageKey: schema.storageCleanupJobs.storageKey })
      .from(schema.storageCleanupJobs)
      .where(eq(schema.storageCleanupJobs.storageKey, before[0]!.storageKey));
    expect(cleanup).toHaveLength(1);
  });

  it("compensates already stored images after a partial provider failure", async () => {
    const storage = new MemoryStorage();
    storage.failPutAfter = 1;
    await expect(
      createListing(
        database,
        storage,
        owner,
        { ...listingInput("4.00", "draft"), title: "Provider failure" },
        [
          { buffer: image, declaredMimeType: "image/jpeg" },
          { buffer: image, declaredMimeType: "image/jpeg" },
        ],
      ),
    ).rejects.toThrow("provider unavailable");
    expect(storage.content.size).toBe(0);
    expect(storage.deleted).toHaveLength(1);
  });

  it("compensates storage when image metadata persistence makes the transaction fail", async () => {
    const storage = new MemoryStorage();
    storage.returnedKey = "duplicate-provider-key";
    await expect(
      createListing(
        database,
        storage,
        owner,
        { ...listingInput("4.00", "draft"), title: "Database failure" },
        [
          { buffer: image, declaredMimeType: "image/jpeg" },
          { buffer: image, declaredMimeType: "image/jpeg" },
        ],
      ),
    ).rejects.toThrow();
    expect(storage.content.size).toBe(0);
    expect(storage.deleted).toHaveLength(2);
    const rows = await database
      .select()
      .from(schema.listings)
      .where(eq(schema.listings.title, "Database failure"));
    expect(rows).toHaveLength(0);
  });

  it("uses collision-resistant stable slugs for identical authored names", async () => {
    const rows = await database
      .select({ slug: schema.listings.slug })
      .from(schema.listings)
      .where(eq(schema.listings.title, "Rfissa maison بالدجاج"));
    expect(new Set(rows.map(({ slug }) => slug)).size).toBe(rows.length);
    expect(
      rows.every(({ slug }) =>
        /^rfissa-maison-بالدجاج-[0-9a-f]{8}$/u.test(slug),
      ),
    ).toBe(true);
  });

  it("hides active content when seller, account, category, city, or area is unavailable", async () => {
    const [visible] = await database
      .select({ id: schema.listings.id, slug: schema.listings.slug })
      .from(schema.listings)
      .where(eq(schema.listings.status, "ACTIVE"))
      .limit(1);
    expect(visible).toBeDefined();
    await database
      .update(schema.areas)
      .set({ active: false })
      .where(eq(schema.areas.id, areaId));
    expect(
      await selectPublicListingBySlug(database, "en", visible!.slug),
    ).toBeNull();
    await database
      .update(schema.areas)
      .set({ active: true })
      .where(eq(schema.areas.id, areaId));
  });

  it("has the required relational indexes and positive-price constraint in real PostgreSQL", async () => {
    const result = await database.execute<{ definition: string }>(sql`
      select pg_get_constraintdef(oid) as definition
      from pg_constraint
      where conname = 'listings_price_positive'
    `);
    expect(result.rows[0]?.definition).toContain("price_amount >");
    const indexes = await database.execute<{ indexname: string }>(sql`
      select indexname from pg_indexes where tablename in ('listings', 'listing_images')
    `);
    expect(indexes.rows.map(({ indexname }) => indexname)).toEqual(
      expect.arrayContaining([
        "listings_seller_status_idx",
        "listings_category_status_idx",
        "listing_images_listing_order_unique",
      ]),
    );
    const seller = await selectSellerForUser(database, ownerId);
    await expect(
      database.insert(schema.listings).values({
        areaId,
        categoryId,
        cityId,
        deliveryAvailable: false,
        pickupAvailable: false,
        priceAmount: "1.00",
        publicLatitude: "33.583000",
        publicLocationVersion: "area-centroid-v1",
        publicLongitude: "-7.632000",
        publishedAt: new Date(),
        sellerProfileId: seller!.id,
        slug: "invalid-fulfillment",
        status: "ACTIVE",
        title: "Invalid fulfillment",
      }),
    ).rejects.toMatchObject({ cause: { code: "23514" } });
  });
});

function principal(userId: string): Principal {
  return { emailVerified: true, role: "USER", status: "ACTIVE", userId };
}

function sellerInput(displayName: string) {
  return {
    allowPhone: false,
    allowPlatformMessages: true,
    allowWhatsApp: true,
    areaId: AREA_ID,
    bio: "Plats maison — وصفات عائلية",
    cityId: CITY_ID,
    contactPhone: "+212 600000000",
    displayName,
  } as const;
}

function listingInput(priceAmount: string | null, intent: "draft" | "publish") {
  return {
    areaId: AREA_ID,
    categoryId: CATEGORY_ID,
    cityId: CITY_ID,
    deliveryAvailable: true,
    description: "Recette familiale, préparée le jour même — وصفة عائلية",
    intent,
    pickupAvailable: true,
    priceAmount,
    title: "Rfissa maison بالدجاج",
  } as const;
}
