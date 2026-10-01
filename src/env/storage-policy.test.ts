import { describe, expect, it } from "vitest";

import { assertStoragePolicy } from "./storage-policy";

describe("listing storage runtime policy", () => {
  it("forbids local storage in production runtime", () => {
    expect(() =>
      assertStoragePolicy({
        apiKey: undefined,
        apiSecret: undefined,
        cloudName: undefined,
        driver: "local",
        productionBuild: false,
        runtime: "production",
      }),
    ).toThrow("forbidden in production");
  });

  it("requires complete Cloudinary credentials outside build analysis", () => {
    expect(() =>
      assertStoragePolicy({
        apiKey: undefined,
        apiSecret: undefined,
        cloudName: "cloud",
        driver: "cloudinary",
        productionBuild: false,
        runtime: "production",
      }),
    ).toThrow("configuration is incomplete");
    expect(() =>
      assertStoragePolicy({
        apiKey: "key",
        apiSecret: "secret",
        cloudName: "cloud",
        driver: "cloudinary",
        productionBuild: false,
        runtime: "production",
      }),
    ).not.toThrow();
  });
});
