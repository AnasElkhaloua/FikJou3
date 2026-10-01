import sharp, { type Metadata } from "sharp";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_COUNT = 6;
const MIN_IMAGE_EDGE = 320;
const MAX_IMAGE_EDGE = 6000;
const MAX_IMAGE_PIXELS = 24_000_000;
const acceptedFormats = new Set(["jpeg", "png", "webp"]);

export class ImageValidationError extends Error {
  constructor(
    public readonly code: "EMPTY" | "FORMAT" | "SIZE" | "DIMENSIONS" | "COUNT",
  ) {
    super(code);
    this.name = "ImageValidationError";
  }
}

export type ProcessedImage = Readonly<{
  buffer: Buffer;
  byteSize: number;
  height: number;
  mimeType: "image/webp";
  width: number;
}>;

export async function processListingImage(
  input: Buffer,
  declaredMimeType: string,
): Promise<ProcessedImage> {
  if (input.length === 0) throw new ImageValidationError("EMPTY");
  if (input.length > MAX_IMAGE_BYTES) throw new ImageValidationError("SIZE");

  let metadata: Metadata;
  try {
    metadata = await sharp(input, {
      limitInputPixels: MAX_IMAGE_PIXELS,
    }).metadata();
  } catch {
    throw new ImageValidationError("FORMAT");
  }

  if (!metadata.format || !acceptedFormats.has(metadata.format)) {
    throw new ImageValidationError("FORMAT");
  }
  const expectedMimeType =
    metadata.format === "jpeg" ? "image/jpeg" : `image/${metadata.format}`;
  if (declaredMimeType !== expectedMimeType) {
    throw new ImageValidationError("FORMAT");
  }
  if (
    !metadata.width ||
    !metadata.height ||
    Math.min(metadata.width, metadata.height) < MIN_IMAGE_EDGE ||
    Math.max(metadata.width, metadata.height) > MAX_IMAGE_EDGE ||
    metadata.width * metadata.height > MAX_IMAGE_PIXELS
  ) {
    throw new ImageValidationError("DIMENSIONS");
  }

  const buffer = await sharp(input, { limitInputPixels: MAX_IMAGE_PIXELS })
    .rotate()
    .resize({
      height: 2048,
      width: 2048,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();
  const output = await sharp(buffer).metadata();
  if (!output.width || !output.height) throw new ImageValidationError("FORMAT");

  return {
    buffer,
    byteSize: buffer.length,
    height: output.height,
    mimeType: "image/webp",
    width: output.width,
  };
}
