import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { isStorageKey } from "./keys";
import type { LocalImageStorage, PutImageInput, StoredImage } from "./types";

export class LocalStorageAdapter implements LocalImageStorage {
  private readonly root: string;

  constructor(root: string) {
    this.root = resolve(root);
  }

  private pathFor(storageKey: string): string {
    if (!isStorageKey(storageKey)) throw new Error("Invalid storage key.");
    const path = resolve(this.root, `${storageKey}.webp`);
    if (
      !path.startsWith(`${this.root}\\`) &&
      !path.startsWith(`${this.root}/`)
    ) {
      throw new Error("Storage path escaped its configured root.");
    }
    return path;
  }

  async put({ buffer, storageKey }: PutImageInput): Promise<StoredImage> {
    await mkdir(this.root, { recursive: true });
    await writeFile(this.pathFor(storageKey), buffer, { flag: "wx" });
    return {
      deliveryUrl: `/api/media/${storageKey}`,
      storageKey,
    };
  }

  async delete(storageKey: string): Promise<void> {
    await rm(this.pathFor(storageKey), { force: true });
  }

  async read(storageKey: string): Promise<Buffer> {
    return readFile(this.pathFor(storageKey));
  }
}
