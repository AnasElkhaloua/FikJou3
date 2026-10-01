import { describe, expect, it } from "vitest";

import { formatMadDecimal } from "@/i18n/formats";

import {
  normalizeOptionalPositiveMoney,
  normalizePositiveMoney,
} from "./money";

describe("decimal-safe listing money", () => {
  it("normalizes supported positive scale-two values without arithmetic", () => {
    expect(normalizePositiveMoney("0.01")).toBe("0.01");
    expect(normalizePositiveMoney("125")).toBe("125.00");
    expect(normalizePositiveMoney("9999999999.99")).toBe("9999999999.99");
    expect(normalizeOptionalPositiveMoney(" ")).toBeNull();
  });

  it("rejects zero, negative, excess scale and out-of-range values", () => {
    for (const value of [
      "0",
      "0.00",
      "-1",
      "1.001",
      "10000000000.00",
      "free",
    ]) {
      expect(() => normalizePositiveMoney(value)).toThrow();
    }
  });

  it("formats the decimal string without converting authoritative money to a number", () => {
    expect(formatMadDecimal("1234.50", "en")).toContain("1,234.50");
    expect(formatMadDecimal("1234.50", "fr")).toMatch(/1[.\s\u202f]234,50/u);
  });
});
