import { describe, expect, it } from "vitest";

import { createStableSlug, slugBase } from "./slug";

describe("stable collision-safe slugs", () => {
  it("retains useful Unicode identity and adds unique suffixes", () => {
    expect(slugBase("Rfissa maison بالدجاج", "listing")).toContain("بالدجاج");
    const first = createStableSlug("Kitchen Atlas", "seller");
    const second = createStableSlug("Kitchen Atlas", "seller");
    expect(first).not.toBe(second);
    expect(first).toMatch(/^kitchen-atlas-[0-9a-f]{8}$/u);
  });
});
