import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { PostgresInstance } from "pg-embedded";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { selectActiveCategories } from "../../src/modules/categories/repository";
import * as schema from "../../src/server/db/schema";
import { seedReferenceData } from "../../src/server/db/seed";

describe("Phase 02 category presentation source", () => {
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
  });

  afterAll(async () => {
    if (pool) await pool.end();
    if (postgres) {
      await postgres.stop();
      await postgres.cleanup();
    }
  });

  it("returns ordered English labels from normalized PostgreSQL rows", async () => {
    const categories = await selectActiveCategories(database, "en");
    expect(categories).toHaveLength(9);
    expect(categories[0]).toMatchObject({
      name: "Moroccan",
      slug: "moroccan",
    });
  });

  it("selects French labels without duplicating category identity", async () => {
    const english = await selectActiveCategories(database, "en");
    const french = await selectActiveCategories(database, "fr");
    expect(french.find((category) => category.slug === "cakes")?.name).toBe(
      "Gâteaux",
    );
    expect(french.map(({ id }) => id)).toEqual(english.map(({ id }) => id));
  });
});
