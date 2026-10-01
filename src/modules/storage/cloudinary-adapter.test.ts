import { afterEach, describe, expect, it, vi } from "vitest";

import { CloudinaryStorageAdapter } from "./cloudinary-adapter";

describe("Cloudinary storage adapter contract", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps provider signing and identifiers behind the storage boundary", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ secure_url: "https://cdn.example/image.webp" }),
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: "ok" })));
    vi.stubGlobal("fetch", fetchMock);
    const adapter = new CloudinaryStorageAdapter({
      apiKey: "test-key",
      apiSecret: "server-secret",
      cloudName: "test-cloud",
    });

    const uploaded = await adapter.put({
      buffer: Buffer.from("processed-webp"),
      storageKey: "opaque-key",
    });
    expect(uploaded).toEqual({
      deliveryUrl: "https://cdn.example/image.webp",
      storageKey: "opaque-key",
    });
    await adapter.delete("opaque-key");

    expect(fetchMock.mock.calls[0]?.[0]).toContain("/image/upload");
    expect(fetchMock.mock.calls[1]?.[0]).toContain("/image/destroy");
    expect(String(fetchMock.mock.calls)).not.toContain("server-secret");
  });

  it("fails closed on unsuccessful provider responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
    );
    const adapter = new CloudinaryStorageAdapter({
      apiKey: "key",
      apiSecret: "secret",
      cloudName: "cloud",
    });
    await expect(
      adapter.put({ buffer: Buffer.from("webp"), storageKey: "opaque" }),
    ).rejects.toThrow("Cloudinary upload failed (503)");
  });
});
