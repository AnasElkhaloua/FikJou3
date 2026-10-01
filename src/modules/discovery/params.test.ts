import { describe, expect, it } from "vitest";

import {
  MAX_SEARCH_LENGTH,
  normalizeSearchQuery,
  parseDiscoveryParams,
  serializeDiscoveryParams,
  withDiscoveryChanges,
} from "./params";

describe("discovery URL grammar", () => {
  it("normalizes whitespace without changing authored Unicode", () => {
    expect(normalizeSearchQuery("  كيك\t  au  citron  ")).toBe("كيك au citron");
    expect(normalizeSearchQuery("Crème")).toBe("Crème");
  });

  it("parses the allow-listed filters and canonicalizes defaults", () => {
    const parsed = parseDiscoveryParams({
      area: "Maarif",
      category: "Desserts",
      city: "Casablanca",
      delivery: "1",
      max: "100.00",
      min: "20.50",
      page: "2",
      pickup: "1",
      q: "  couscous   poulet ",
      sort: "price-asc",
    });
    expect(parsed.issues).toEqual([]);
    expect(parsed.input).toMatchObject({
      area: "maarif",
      category: "desserts",
      city: "casablanca",
      maxPrice: "100",
      minPrice: "20.5",
      page: 2,
      query: "couscous poulet",
      sort: "price-asc",
    });
    expect(serializeDiscoveryParams(parsed.input).toString()).toBe(
      "q=couscous+poulet&city=casablanca&area=maarif&category=desserts&min=20.5&max=100&pickup=1&delivery=1&sort=price-asc&page=2",
    );
  });

  it("rejects untrusted sort, pagination, decimal, and location states safely", () => {
    const parsed = parseDiscoveryParams({
      area: "../../secret",
      max: "10",
      min: "20",
      page: "999999",
      sort: "price_amount desc; drop table listings",
    });
    expect(parsed.input).toMatchObject({
      area: null,
      maxPrice: null,
      minPrice: null,
      page: 1,
      sort: "newest",
    });
    expect(parsed.issues).toEqual(
      expect.arrayContaining([
        "invalid-area",
        "invalid-price-range",
        "invalid-page",
        "invalid-sort",
      ]),
    );
  });

  it("rejects zero, negative, excessive-precision, and overlong input", () => {
    for (const min of ["0", "0.00", "-1", "1.001", "not-money"]) {
      expect(parseDiscoveryParams({ min }).input.minPrice).toBeNull();
    }
    const parsed = parseDiscoveryParams({
      q: "x".repeat(MAX_SEARCH_LENGTH + 1),
    });
    expect(parsed.input.query).toBe("");
    expect(parsed.issues).toContain("invalid-query");
  });

  it("resets pagination when a filter changes", () => {
    const input = parseDiscoveryParams({ page: "4", q: "rfissa" }).input;
    expect(withDiscoveryChanges(input, { category: "moroccan" })).toBe(
      "q=rfissa&category=moroccan",
    );
  });
});
