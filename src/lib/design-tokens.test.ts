import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);

function readColorToken(name: string): string {
  const match = stylesheet.match(
    new RegExp(`--fik-${name}:\\s*(#[0-9a-f]{6})`, "iu"),
  );

  if (!match?.[1]) {
    throw new Error(`Missing color token: ${name}`);
  }

  return match[1];
}

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/gu)
    ?.map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );

  if (!channels || channels.length !== 3) {
    throw new Error(`Invalid color: ${hex}`);
  }

  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

describe("design tokens", () => {
  it("preserves the authoritative light palette", () => {
    expect(readColorToken("background")).toBe("#f7f7f5");
    expect(readColorToken("surface")).toBe("#ffffff");
    expect(readColorToken("primary")).toBe("#e94b35");
    expect(readColorToken("accent")).toBe("#f3a83b");
    expect(readColorToken("text")).toBe("#1d1d1b");
    expect(readColorToken("muted")).toBe("#73736f");
    expect(readColorToken("border")).toBe("#e7e5e1");
  });

  it("provides accessible semantic text and focus combinations", () => {
    expect(
      contrastRatio(readColorToken("text"), readColorToken("background")),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(readColorToken("muted"), readColorToken("surface")),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(readColorToken("on-primary"), readColorToken("primary")),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(readColorToken("focus"), readColorToken("surface")),
    ).toBeGreaterThanOrEqual(3);
  });
});
