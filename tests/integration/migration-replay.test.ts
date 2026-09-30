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
    for (const databaseName of ["phase01_first", "phase01_replay"]) {
      await postgres.createDatabase(databaseName);
      const connectionString = postgres.connectionInfo.connectionString.replace(
        /\/postgres$/u,
        `/${databaseName}`,
      );
      const pool = new Pool({ connectionString });
      const database = drizzle(pool, { schema });
      try {
        await migrate(database, { migrationsFolder: "drizzle" });
        const result = await database.execute<{ count: string }>(sql`
          select count(*)::text as count
          from information_schema.tables
          where table_schema = 'public'
        `);
        expect(Number(result.rows[0]?.count)).toBe(16);
      } finally {
        await pool.end();
      }
    }
  });
});
