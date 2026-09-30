import { PostgresInstance } from "pg-embedded";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("PostgreSQL integration harness", () => {
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

  it("starts a disposable real PostgreSQL server", async () => {
    expect(postgres.isHealthy()).toBe(true);
    expect(await postgres.databaseExists("postgres")).toBe(true);
    expect(postgres.getPostgreSqlVersion()).toMatch(/^18\./u);
  });
});
