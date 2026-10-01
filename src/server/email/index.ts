import "server-only";

import { Resend } from "resend";

import { emailProviderConfiguration, serverEnv } from "@/env/server";

import { DevelopmentFileEmailSender } from "./development-sender";
import { ResendEmailSender } from "./resend-sender";
import type { EmailSender } from "./types";

function createEmailSender(): EmailSender {
  if (serverEnv.EMAIL_DELIVERY_MODE === "development") {
    return new DevelopmentFileEmailSender(serverEnv.DEV_EMAIL_OUTBOX_DIR);
  }

  if (!emailProviderConfiguration) {
    throw new Error("Provider email configuration is unavailable.");
  }

  return new ResendEmailSender(
    new Resend(emailProviderConfiguration.apiKey),
    emailProviderConfiguration.from,
  );
}

export const emailSender = createEmailSender();
