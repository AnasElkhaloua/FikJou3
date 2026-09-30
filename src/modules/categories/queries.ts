import "server-only";

import type { AppLocale } from "@/i18n/config";
import { db } from "@/server/db/client";

import { selectActiveCategories } from "./repository";

export async function listActiveCategories(
  locale: AppLocale,
): ReturnType<typeof selectActiveCategories> {
  return selectActiveCategories(db, locale);
}

export type { PublicCategory } from "./repository";
