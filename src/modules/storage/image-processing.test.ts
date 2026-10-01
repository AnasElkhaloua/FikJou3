import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { ImageValidationError, processListingImage } from "./image-processing";

describe("listing image processing", () => {
  it("decodes and re-encodes an allowed raster as metadata-free WebP", async () => {
    const source = await sharp({
      create: { background: "#E94B35", channels: 3, height: 360, width: 480 },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    const result = await processListingImage(source, "image/jpeg");
    const metadata = await sharp(result.buffer).metadata();
    expect(result.mimeType).toBe("image/webp");
    expect(metadata.format).toBe("webp");
    expect(metadata.exif).toBeUndefined();
    expect(result.width).toBe(360);
    expect(result.height).toBe(480);
  });

  it("rejects disguised executable bytes and undersized images", async () => {
    await expect(
      processListingImage(Buffer.from("<svg><script/></svg>"), "image/svg+xml"),
    ).rejects.toBeInstanceOf(ImageValidationError);
    const tiny = await sharp({
      create: { background: "white", channels: 3, height: 10, width: 10 },
    })
      .png()
      .toBuffer();
    await expect(processListingImage(tiny, "image/png")).rejects.toMatchObject({
      code: "DIMENSIONS",
    });
  });

  it("rejects a declared MIME type that disagrees with decoded bytes", async () => {
    const jpeg = await sharp({
      create: { background: "white", channels: 3, height: 360, width: 480 },
    })
      .jpeg()
      .toBuffer();
    await expect(processListingImage(jpeg, "image/png")).rejects.toMatchObject({
      code: "FORMAT",
    });
  });
});
