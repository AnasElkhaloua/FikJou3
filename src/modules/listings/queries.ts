import "server-only";

import type { AppLocale } from "@/i18n/config";
import { db } from "@/server/db/client";

import {
  selectOwnedListingForEdit,
  selectOwnedListings,
  selectPublicListingBySlug,
} from "./repository";

export const getOwnedListings = (userId: string) =>
  selectOwnedListings(db, userId);
export const getOwnedListingForEdit = (userId: string, id: string) =>
  selectOwnedListingForEdit(db, userId, id);
export const getPublicListingBySlug = (locale: AppLocale, slug: string) =>
  selectPublicListingBySlug(db, locale, slug);
