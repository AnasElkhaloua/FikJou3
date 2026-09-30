import { describe, expect, it } from "vitest";

import { safeAuthReturnPath } from "./redirects";

describe("safeAuthReturnPath", () => {
  it("accepts locale-matching internal destinations", () => {
    expect(safeAuthReturnPath("/fr/settings?tab=security", "fr")).toBe(
      "/fr/settings?tab=security",
    );
  });

  it.each([
    "https://evil.example/steal",
    "//evil.example/steal",
    "/en/settings",
    "javascript:alert(1)",
  ])("rejects unsafe destination %s", (candidate) => {
    expect(safeAuthReturnPath(candidate, "fr")).toBe("/fr");
  });
});
