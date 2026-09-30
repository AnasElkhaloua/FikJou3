import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { PostgresInstance } from "pg-embedded";
import { Pool } from "pg";

import * as schema from "../src/server/db/schema";
import { seedReferenceData } from "../src/server/db/seed";

const postgres = new PostgresInstance({
  databaseName: "postgres",
  persistent: false,
  port: 0,
  setupTimeout: 150,
  timeout: 60,
});

let exitCode = 1;

const workspaceDirectory = fileURLToPath(new URL("../", import.meta.url));
const nextCacheDirectory = join(workspaceDirectory, ".next");

async function clearNextDevelopmentCache() {
  if (
    dirname(nextCacheDirectory) !== workspaceDirectory.replace(/[\\/]$/u, "")
  ) {
    throw new Error("Refusing to clear a Next.js cache outside the workspace.");
  }
  await rm(nextCacheDirectory, { force: true, recursive: true });
}

try {
  await postgres.start();
  const connectionString = postgres.connectionInfo.connectionString;
  const pool = new Pool({ connectionString });
  const database = drizzle(pool, { schema });

  try {
    await migrate(database, { migrationsFolder: "drizzle" });
    await seedReferenceData(database);
  } finally {
    await pool.end();
  }

  const playwrightCli = fileURLToPath(
    new URL("../node_modules/@playwright/test/cli.js", import.meta.url),
  );
  const runPlaywright = async (
    args: string[],
    previewMode: "empty" | "populated",
  ) => {
    await clearNextDevelopmentCache();
    const child = spawn(process.execPath, [playwrightCli, "test", ...args], {
      env: {
        ...process.env,
        DATABASE_URL: connectionString,
        EMAIL_DELIVERY_MODE: "development",
        FIK_MARKETPLACE_PREVIEW: previewMode,
      },
      stdio: "inherit",
    });

    return new Promise<number>((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", (code) => resolve(code ?? 1));
    });
  };

  exitCode = await runPlaywright(["--grep-invert", "@empty"], "populated");
  if (exitCode === 0) {
    exitCode = await runPlaywright(["--grep", "@empty"], "empty");
  }
} finally {
  await postgres.stop();
  await postgres.cleanup();
}

process.exitCode = exitCode;
