import { describe, expect, it } from "vitest";

import { defaultLocale, isAppLocale, locales } from "./config";

describe("locale contract", () => {
  it("defines the complete V1 locale set and English fallback", () => {
    expect(locales).toEqual(["en", "fr"]);
    expect(defaultLocale).toBe("en");
  });

  it("rejects locales outside the V1 contract", () => {
    expect(isAppLocale("en")).toBe(true);
    expect(isAppLocale("fr")).toBe(true);
    expect(isAppLocale("ar")).toBe(false);
    expect(isAppLocale("EN")).toBe(false);
  });
});
