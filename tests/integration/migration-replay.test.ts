import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { PostgresInstance } from "pg-embedded";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import * as schema from "../../src/server/db/schema";

describe("migration replay", () => {
  let postgres: PostgresInstance;

  beforeAll(async () => {
    postgres = new PostgresInstance({
      databaseName: "postgres",
      persistent: false,
      port: 0,
      setupTimeout: 150,
      timeout: 60,
    });
    await postgres.start();
  });

  afterAll(async () => {
    if (postgres) {
      await postgres.stop();
      await postgres.cleanup();
    }
  });

  it("replays committed migrations on two empty PostgreSQL databases", async () => {
    for (const databaseName of ["phase03_first", "phase03_replay"]) {
      await postgres.createDatabase(databaseName);
      const connectionString = postgres.connectionInfo.connectionString.replace(
        /\/postgres$/u,
        `/${databaseName}`,
      );
      const pool = new Pool({ connectionString });
      const database = drizzle(pool, { schema });
      try {
        await migrate(database, { migrationsFolder: "drizzle" });
        const result = await database.execute<{ table_name: string }>(sql`
          select table_name
          from information_schema.tables
          where table_schema = 'public'
          order by table_name
        `);
        expect(result.rows.map(({ table_name }) => table_name)).toEqual(
          expect.arrayContaining([
            "listing_images",
            "listing_tags",
            "listings",
            "storage_cleanup_jobs",
          ]),
        );
        expect(result.rows).toHaveLength(20);
        const constraints = await database.execute<{ conname: string }>(sql`
          select conname from pg_constraint
          where conname in (
            'listings_price_positive',
            'listings_active_publish_fields',
            'listing_images_order_range'
          )
        `);
        expect(constraints.rows.map(({ conname }) => conname)).toHaveLength(3);
      } finally {
        await pool.end();
      }
    }
  });
});
