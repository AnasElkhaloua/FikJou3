import "server-only";

import type { AppLocale } from "@/i18n/config";
import { db } from "@/server/db/client";

import { selectActiveLocationOptions } from "./repository";

export function listActiveLocationOptions(locale: AppLocale) {
  return selectActiveLocationOptions(db, locale);
}
