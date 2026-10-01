import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { storageCleanupJobs } from "@/server/db/schema";
import type * as schema from "@/server/db/schema";

import type { ImageStorage } from "./types";

export async function deleteOrQueueStorageKeys(
  database: NodePgDatabase<typeof schema>,
  storage: ImageStorage,
  keys: readonly string[],
) {
  for (const storageKey of keys) {
    try {
      await storage.delete(storageKey);
    } catch (error) {
      await database.insert(storageCleanupJobs).values({
        attempts: 1,
        lastError: error instanceof Error ? error.name : "StorageError",
        storageKey,
      });
    }
  }
}
