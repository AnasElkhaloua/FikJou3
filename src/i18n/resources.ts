import en from "./messages/en.json";
import fr from "./messages/fr.json";

import type { AppLocale } from "./config";

export type AppMessages = typeof en;

const messages = { en, fr } satisfies Record<AppLocale, AppMessages>;

export async function loadMessages(locale: AppLocale): Promise<AppMessages> {
  return messages[locale];
}
