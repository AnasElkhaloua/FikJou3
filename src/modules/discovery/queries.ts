import "server-only";

import type { AppLocale } from "@/i18n/config";
import { db } from "@/server/db/client";

import type { DiscoveryInput } from "./params";
import { selectDiscoveryListings } from "./repository";

export function discoverListings(locale: AppLocale, input: DiscoveryInput) {
  return selectDiscoveryListings(db, locale, input);
}
