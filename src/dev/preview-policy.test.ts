import { describe, expect, it } from "vitest";

import { canLoadMarketplacePreview } from "./preview-policy";

describe("marketplace preview production guard", () => {
  it("allows populated fixtures only in development", () => {
    expect(canLoadMarketplacePreview("development", "populated")).toBe(true);
    expect(canLoadMarketplacePreview("development", "empty")).toBe(false);
    expect(canLoadMarketplacePreview("test", "populated")).toBe(false);
    expect(canLoadMarketplacePreview("production", "populated")).toBe(false);
  });
});
