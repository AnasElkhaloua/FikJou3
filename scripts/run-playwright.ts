import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { PostgresInstance } from "pg-embedded";
import { Pool } from "pg";
import sharp from "sharp";

import * as schema from "../src/server/db/schema";
import { seedReferenceData } from "../src/server/db/seed";
import { createAuth } from "../src/modules/auth/create-auth";
import {
  areaSeeds,
  categorySeeds,
  citySeeds,
} from "../src/server/db/seed-data";

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
    const discoveryUserId = "71000000-0000-4000-8000-000000000001";
    const discoverySellerId = "72000000-0000-4000-8000-000000000001";
    await database.insert(schema.users).values({
      email: "phase04-discovery@example.test",
      emailVerified: true,
      id: discoveryUserId,
      name: "Discovery Cook",
    });
    await database.insert(schema.sellerProfiles).values({
      areaId: areaSeeds[0][0],
      cityId: citySeeds[0].id,
      displayName: "Cuisine Atlas",
      id: discoverySellerId,
      slug: "cuisine-atlas",
      userId: discoveryUserId,
    });
    const listingRows = Array.from({ length: 15 }, (_, index) => ({
      areaId: index === 14 ? areaSeeds[2][0] : areaSeeds[0][0],
      categoryId: index === 0 ? categorySeeds[2][0] : categorySeeds[0][0],
      cityId: index === 14 ? citySeeds[1].id : citySeeds[0].id,
      deliveryAvailable: index === 0 || index === 14,
      description:
        index === 0
          ? "Pastilla familiale au poulet et aux amandes"
          : "Homemade discovery dish",
      id: `73000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      pickupAvailable: index !== 14,
      priceAmount: index === 0 ? "45.50" : `${20 + index}.00`,
      publicLatitude: index === 14 ? "33.991000" : "33.583000",
      publicLocationVersion: "area-centroid-v1",
      publicLongitude: index === 14 ? "-6.849000" : "-7.632000",
      publishedAt: new Date(Date.UTC(2026, 8, 30, 12, 0, -index)),
      sellerProfileId: discoverySellerId,
      slug: index === 0 ? "pastilla-discovery" : `playwright-dish-${index + 1}`,
      status: "ACTIVE" as const,
      title:
        index === 0 ? "Pastilla poulet maison" : `Playwright dish ${index + 1}`,
    }));
    await database.insert(schema.listings).values(listingRows);
    await mkdir(uploadDirectory, { recursive: true });
    const image = await sharp({
      create: {
        background: { alpha: 1, b: 55, g: 126, r: 224 },
        channels: 4,
        height: 480,
        width: 640,
      },
    })
      .webp()
      .toBuffer();
    await database.insert(schema.listingImages).values(
      listingRows.map((listing, index) => {
        const storageKey = `74000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
        return {
          byteSize: image.byteLength,
          deliveryUrl: `/api/media/${storageKey}`,
          height: 480,
          listingId: listing.id,
          mimeType: "image/webp",
          sortOrder: 0,
          storageKey,
          width: 640,
        };
      }),
    );
    await Promise.all(
      listingRows.map((_, index) =>
        writeFile(
          join(
            uploadDirectory,
            `74000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}.webp`,
          ),
          image,
        ),
      ),
    );
  } finally {
    await pool.end();
  }

  const playwrightCli = fileURLToPath(
    new URL("../node_modules/@playwright/test/cli.js", import.meta.url),
  );
  const runPlaywright = async (args: string[]) => {
    await clearNextDevelopmentCache();
    const child = spawn(process.execPath, [playwrightCli, "test", ...args], {
      env: {
        ...process.env,
        DATABASE_URL: connectionString,
        EMAIL_DELIVERY_MODE: "development",
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

  exitCode = await runPlaywright(requestedTests);
} finally {
  await postgres.stop();
  await postgres.cleanup();
  await rm(uploadDirectory, { force: true, recursive: true });
}

process.exitCode = exitCode;
