import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createStorageKey } from "./keys";
import { LocalStorageAdapter } from "./local-adapter";

describe("local image storage adapter", () => {
  const directories: string[] = [];

  afterEach(async () => {
    await Promise.all(
      directories
        .splice(0)
        .map((path) => rm(path, { force: true, recursive: true })),
    );
  });

  it("stores, reads and deletes only opaque keys below its configured root", async () => {
    const directory = await mkdtemp(join(tmpdir(), "fikjou3-storage-"));
    directories.push(directory);
    const storage = new LocalStorageAdapter(directory);
    const key = createStorageKey();
    await storage.put({ buffer: Buffer.from("safe"), storageKey: key });
    expect((await storage.read(key)).toString()).toBe("safe");
    await storage.delete(key);
    await expect(storage.read(key)).rejects.toThrow();
    await expect(storage.read("../escape")).rejects.toThrow(
      "Invalid storage key",
    );
  });
});
