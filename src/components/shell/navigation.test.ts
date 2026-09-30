import { describe, expect, it } from "vitest";

import {
  desktopNavigation,
  isNavigationCurrent,
  mobileNavigation,
} from "./navigation";

describe("public shell navigation", () => {
  it("exposes only implemented destinations as links", () => {
    expect(desktopNavigation.filter((item) => item.href)).toHaveLength(1);
    expect(mobileNavigation.filter((item) => item.href)).toHaveLength(2);
  });

  it("marks exact home and nested Explore destinations correctly", () => {
    expect(isNavigationCurrent("/", "/")).toBe(true);
    expect(isNavigationCurrent("/explore", "/explore")).toBe(true);
    expect(isNavigationCurrent("/explore/results", "/explore")).toBe(true);
    expect(isNavigationCurrent("/login", "/")).toBe(false);
    expect(isNavigationCurrent("/", null)).toBe(false);
  });
});
