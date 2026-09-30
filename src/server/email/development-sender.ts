import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { EmailSender, TransactionalEmail } from "./types";

export class DevelopmentFileEmailSender implements EmailSender {
  constructor(private readonly outboxDirectory: string) {}

  async send(message: TransactionalEmail): Promise<void> {
    const directory = resolve(this.outboxDirectory);
    await mkdir(directory, { recursive: true });
    const path = resolve(directory, `${Date.now()}-${randomUUID()}.json`);

    if (
      !path.startsWith(`${directory}\\`) &&
      !path.startsWith(`${directory}/`)
    ) {
      throw new Error(
        "Refusing to write outside the development email outbox.",
      );
    }

    await writeFile(path, `${JSON.stringify(message, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
  }
}
