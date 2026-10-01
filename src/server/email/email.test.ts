import { randomUUID } from "node:crypto";
import { readFile, readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { DevelopmentFileEmailSender } from "./development-sender";
import {
  EmailDeliveryError,
  ResendEmailSender,
  type ResendEmailClient,
} from "./resend-sender";
import type { TransactionalEmail } from "./types";

const testDirectories: string[] = [];

function message(kind: TransactionalEmail["kind"]): TransactionalEmail {
  return {
    html: `<p>Fik Jou3?</p><a href="https://example.test/secret-token">Continue</a>`,
    kind,
    locale: "en",
    recipient: "person@example.test",
    subject:
      kind === "email-verification"
        ? "Verify your Fik Jou3? email address"
        : "Reset your Fik Jou3? password",
    text: "Continue: https://example.test/secret-token",
  };
}

afterEach(async () => {
  await Promise.all(
    testDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("transactional email senders", () => {
  it("preserves development outbox delivery", async () => {
    const directory = resolve(".tmp", "email-tests", randomUUID());
    testDirectories.push(directory);
    const email = message("email-verification");

    await new DevelopmentFileEmailSender(directory).send(email);

    const files = await readdir(directory);
    expect(files).toHaveLength(1);
    expect(
      JSON.parse(await readFile(resolve(directory, files[0]!), "utf8")),
    ).toEqual(email);
  });

  it.each(["email-verification", "password-reset"] as const)(
    "delivers %s messages through the Resend boundary",
    async (kind) => {
      const requests: unknown[] = [];
      const client: ResendEmailClient = {
        emails: {
          async send(request) {
            requests.push(request);
            return { error: null };
          },
        },
      };

      await new ResendEmailSender(
        client,
        "Fik Jou3? <noreply@example.com>",
      ).send(message(kind));

      expect(requests).toEqual([
        {
          from: "Fik Jou3? <noreply@example.com>",
          html: expect.stringContaining("Fik Jou3?"),
          subject: expect.stringContaining("Fik Jou3?"),
          text: expect.stringContaining("https://example.test/secret-token"),
          to: "person@example.test",
        },
      ]);
    },
  );

  it.each(["returned error", "rejected request"])(
    "fails safely for a provider %s",
    async (failure) => {
      const client: ResendEmailClient = {
        emails: {
          async send() {
            if (failure === "rejected request") {
              throw new Error("provider internals re_secret_key");
            }
            return { error: { message: "provider internals re_secret_key" } };
          },
        },
      };

      const delivery = new ResendEmailSender(
        client,
        "noreply@example.com",
      ).send(message("password-reset"));

      await expect(delivery).rejects.toBeInstanceOf(EmailDeliveryError);
      await expect(delivery).rejects.not.toThrow(/provider|secret|token|re_/iu);
    },
  );
});
