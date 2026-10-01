import { createHash } from "node:crypto";

import type { ImageStorage, PutImageInput, StoredImage } from "./types";

type CloudinaryOptions = Readonly<{
  apiKey: string;
  apiSecret: string;
  cloudName: string;
}>;

function sign(parameters: Record<string, string>, secret: string): string {
  const value = Object.entries(parameters)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${key}=${entry}`)
    .join("&");
  return createHash("sha1").update(`${value}${secret}`).digest("hex");
}

export class CloudinaryStorageAdapter implements ImageStorage {
  constructor(private readonly options: CloudinaryOptions) {}

  private publicId(storageKey: string) {
    return `fikjou3/listings/${storageKey}`;
  }

  async put({ buffer, storageKey }: PutImageInput): Promise<StoredImage> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const publicId = this.publicId(storageKey);
    const signed = { overwrite: "false", public_id: publicId, timestamp };
    const body = new FormData();
    body.set("api_key", this.options.apiKey);
    body.set(
      "file",
      new Blob([Uint8Array.from(buffer)], { type: "image/webp" }),
      `${storageKey}.webp`,
    );
    body.set("overwrite", signed.overwrite);
    body.set("public_id", publicId);
    body.set("signature", sign(signed, this.options.apiSecret));
    body.set("timestamp", timestamp);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(this.options.cloudName)}/image/upload`,
      { body, method: "POST" },
    );
    if (!response.ok)
      throw new Error(`Cloudinary upload failed (${response.status}).`);
    const result = (await response.json()) as { secure_url?: string };
    if (!result.secure_url)
      throw new Error("Cloudinary upload returned no delivery URL.");
    return { deliveryUrl: result.secure_url, storageKey };
  }

  async delete(storageKey: string): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const publicId = this.publicId(storageKey);
    const signed = { invalidate: "true", public_id: publicId, timestamp };
    const body = new URLSearchParams({
      api_key: this.options.apiKey,
      ...signed,
      signature: sign(signed, this.options.apiSecret),
    });
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(this.options.cloudName)}/image/destroy`,
      { body, method: "POST" },
    );
    if (!response.ok)
      throw new Error(`Cloudinary deletion failed (${response.status}).`);
  }
}
