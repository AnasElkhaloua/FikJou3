import { describe, expect, it } from "vitest";

import { nextListingStatus } from "./lifecycle";

describe("listing lifecycle", () => {
  it("allows only the V1 transition matrix", () => {
    expect(nextListingStatus("DRAFT", "publish")).toBe("ACTIVE");
    expect(nextListingStatus("ACTIVE", "pause")).toBe("PAUSED");
    expect(nextListingStatus("PAUSED", "reactivate")).toBe("ACTIVE");
    expect(nextListingStatus("DRAFT", "remove")).toBe("REMOVED");
    expect(nextListingStatus("ACTIVE", "remove")).toBe("REMOVED");
    expect(nextListingStatus("PAUSED", "remove")).toBe("REMOVED");
    expect(nextListingStatus("REMOVED", "reactivate")).toBeNull();
    expect(nextListingStatus("ACTIVE", "publish")).toBeNull();
  });
});
