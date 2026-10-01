import { describe, expect, it } from "vitest";

import { validateEmailDeliveryPolicy } from "./email-policy";

describe("email delivery environment policy", () => {
  it("allows development delivery without provider credentials", () => {
    expect(
      validateEmailDeliveryPolicy({
        mode: "development",
        productionBuild: false,
        runtime: "development",
      }),
    ).toBeNull();
  });

  it("requires provider mode in a production runtime", () => {
    expect(() =>
      validateEmailDeliveryPolicy({
        mode: "development",
        productionBuild: false,
        runtime: "production",
      }),
    ).toThrow("EMAIL_DELIVERY_MODE=provider");
  });

  it("requires a Resend key and valid configurable sender in provider mode", () => {
    expect(() =>
      validateEmailDeliveryPolicy({
        mode: "provider",
        productionBuild: false,
        runtime: "production",
      }),
    ).toThrow();
    expect(() =>
      validateEmailDeliveryPolicy({
        apiKey: "invalid",
        from: "not-an-email",
        mode: "provider",
        productionBuild: false,
        runtime: "production",
      }),
    ).toThrow();

    expect(
      validateEmailDeliveryPolicy({
        apiKey: "re_test_key",
        from: "Fik Jou3? <noreply@example.com>",
        mode: "provider",
        productionBuild: false,
        runtime: "production",
      }),
    ).toEqual({
      apiKey: "re_test_key",
      from: "Fik Jou3? <noreply@example.com>",
    });
  });

  it("rejects sender header injection", () => {
    expect(() =>
      validateEmailDeliveryPolicy({
        apiKey: "re_test_key",
        from: "Fik Jou3? <noreply@example.com>\r\nBcc: attacker@example.com",
        mode: "provider",
        productionBuild: false,
        runtime: "production",
      }),
    ).toThrow();
  });
});
