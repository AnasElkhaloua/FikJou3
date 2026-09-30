import { describe, expect, it } from "vitest";

import { inferTextDirection } from "@/lib/text-direction";

describe("inferTextDirection", () => {
  it("keeps Latin content left-to-right", () => {
    expect(inferTextDirection("Fik Jou3?")).toBe("ltr");
  });

  it("recognizes Arabic content as right-to-left", () => {
    expect(inferTextDirection("حلويات أمينة")).toBe("rtl");
  });
});
