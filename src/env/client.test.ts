import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { clientEnv } from "./client";

describe("client environment boundary", () => {
  it("does not expose provider email configuration", async () => {
    expect(Object.keys(clientEnv)).toEqual(["appName"]);

    const clientSources = await Promise.all([
      readFile("src/env/client.ts", "utf8"),
      readFile("next.config.ts", "utf8"),
    ]);

    for (const source of clientSources) {
      expect(source).not.toContain("RESEND_API_KEY");
      expect(source).not.toContain("EMAIL_FROM");
    }
  });
});
