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
import { createAuth } from "../src/modules/auth/create-auth";

const postgres = new PostgresInstance({
  databaseName: "postgres",
  persistent: false,
  port: 0,
  setupTimeout: 150,
  timeout: 60,
});

let exitCode = 1;
const requestedTests = process.argv.slice(2);

const workspaceDirectory = fileURLToPath(new URL("../", import.meta.url));
const nextCacheDirectory = join(workspaceDirectory, ".next");
const uploadDirectory = join(workspaceDirectory, ".tmp", "playwright-uploads");

async function clearNextDevelopmentCache() {
  if (
    dirname(nextCacheDirectory) !== workspaceDirectory.replace(/[\\/]$/u, "")
  ) {
    throw new Error("Refusing to clear a Next.js cache outside the workspace.");
  }
  await rm(nextCacheDirectory, { force: true, recursive: true });
}

try {
  await rm(uploadDirectory, { force: true, recursive: true });
  await postgres.start();
  const connectionString = postgres.connectionInfo.connectionString;
  const pool = new Pool({ connectionString });
  const database = drizzle(pool, { schema });

  try {
    await migrate(database, { migrationsFolder: "drizzle" });
    await seedReferenceData(database);
    const verificationLinks: string[] = [];
    const auth = createAuth({
      baseURL: "http://127.0.0.1:3000",
      database,
      emailSender: {
        async send(message) {
          const link = message.text.match(/https?:\/\/\S+/u)?.[0];
          if (link) verificationLinks.push(link);
        },
      },
      ipAddressHeader: "x-forwarded-for",
      production: false,
      secret: "playwright-test-secret-at-least-thirty-two-bytes",
    });
    const request = (path: string, body?: object) => {
      const init: RequestInit = {
        headers: {
          ...(body ? { "content-type": "application/json" } : {}),
          origin: "http://127.0.0.1:3000",
          "x-forwarded-for": "127.0.0.1",
        },
        method: body ? "POST" : "GET",
      };
      if (body) init.body = JSON.stringify(body);
      return new Request(`http://127.0.0.1:3000${path}`, init);
    };
    for (const [email, name] of [
      ["phase03-owner@example.test", "Phase Three Owner"],
      ["phase03-other@example.test", "Phase Three Other"],
    ]) {
      const signUp = await auth.handler(
        request("/api/auth/sign-up/email", {
          email,
          name,
          password: "phase03-password-long-enough",
          preferredLocale: "en",
        }),
      );
      if (!signUp.ok)
        throw new Error(`Playwright user setup failed (${signUp.status}).`);
      const verificationLink = verificationLinks.shift();
      if (!verificationLink)
        throw new Error("Playwright verification link missing.");
      const verified = await auth.handler(new Request(verificationLink));
      if (![200, 302].includes(verified.status)) {
        throw new Error(`Playwright verification failed (${verified.status}).`);
      }
      const loginCheck = await auth.handler(
        request("/api/auth/sign-in/email", {
          email,
          password: "phase03-password-long-enough",
        }),
      );
      if (!loginCheck.ok) {
        throw new Error(
          `Playwright credential check failed (${loginCheck.status}): ${await loginCheck.text()}`,
        );
      }
    }
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
        LOCAL_UPLOAD_DIR: ".tmp/playwright-uploads",
        STORAGE_DRIVER: "local",
      },
      stdio: "inherit",
    });

    return new Promise<number>((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", (code) => resolve(code ?? 1));
    });
  };

  exitCode = await runPlaywright(
    [...requestedTests, "--grep-invert", "@empty"],
    "populated",
  );
  if (exitCode === 0 && requestedTests.length === 0) {
    exitCode = await runPlaywright(["--grep", "@empty"], "empty");
  }
} finally {
  await postgres.stop();
  await postgres.cleanup();
  await rm(uploadDirectory, { force: true, recursive: true });
}

process.exitCode = exitCode;
