import "server-only";

import type { EmailSender, TransactionalEmail } from "./types";

type ResendRequest = Readonly<{
  from: string;
  html: string;
  subject: string;
  text: string;
  to: string;
}>;

export type ResendEmailClient = Readonly<{
  emails: Readonly<{
    send(message: ResendRequest): Promise<{
      error: unknown | null;
    }>;
  }>;
}>;

export class EmailDeliveryError extends Error {
  constructor() {
    super("Transactional email delivery failed.");
    this.name = "EmailDeliveryError";
  }
}

export class ResendEmailSender implements EmailSender {
  constructor(
    private readonly client: ResendEmailClient,
    private readonly from: string,
  ) {}

  async send(message: TransactionalEmail): Promise<void> {
    try {
      const result = await this.client.emails.send({
        from: this.from,
        html: message.html,
        subject: message.subject,
        text: message.text,
        to: message.recipient,
      });

      if (result.error) {
        throw new EmailDeliveryError();
      }
    } catch {
      throw new EmailDeliveryError();
    }
  }
}
