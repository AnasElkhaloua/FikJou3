import { describe, expect, it } from "vitest";

import { replaceLocalePrefix } from "./paths";

describe("replaceLocalePrefix", () => {
  it("preserves a deep internal destination", () => {
    expect(replaceLocalePrefix("/fr/settings?tab=security", "fr", "en")).toBe(
      "/en/settings?tab=security",
    );
  });

  it.each(["https://evil.example", "//evil.example", "/ar/settings"])(
    "rejects unsafe or unsupported destination %s",
    (path) => expect(replaceLocalePrefix(path, "fr", "en")).toBeNull(),
  );
});
