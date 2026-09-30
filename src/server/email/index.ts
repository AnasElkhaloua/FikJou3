import "server-only";

import { serverEnv } from "@/env/server";

import { DevelopmentFileEmailSender } from "./development-sender";
import type { EmailSender } from "./types";

function createEmailSender(): EmailSender {
  if (serverEnv.EMAIL_DELIVERY_MODE === "development") {
    return new DevelopmentFileEmailSender(serverEnv.DEV_EMAIL_OUTBOX_DIR);
  }

  throw new Error(
    "EMAIL_DELIVERY_MODE=provider requires a production email adapter before deployment.",
  );
}

export const emailSender = createEmailSender();
