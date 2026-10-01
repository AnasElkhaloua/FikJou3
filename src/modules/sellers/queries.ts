import "server-only";

import type { AppLocale } from "@/i18n/config";
import { db } from "@/server/db/client";

import { selectPublicSellerBySlug, selectSellerForUser } from "./repository";

export const getSellerForUser = (userId: string) =>
  selectSellerForUser(db, userId);
export const getPublicSellerBySlug = (locale: AppLocale, slug: string) =>
  selectPublicSellerBySlug(db, locale, slug);
