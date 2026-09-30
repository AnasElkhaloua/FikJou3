export type TransactionalEmail = Readonly<{
  kind: "email-verification" | "password-reset";
  locale: "en" | "fr";
  recipient: string;
  subject: string;
  text: string;
}>;

export interface EmailSender {
  send(message: TransactionalEmail): Promise<void>;
}
