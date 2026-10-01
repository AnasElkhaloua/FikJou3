import { eq, type SQL } from "drizzle-orm";

import {
  areas,
  categories,
  cities,
  countries,
  listings,
  sellerProfiles,
  users,
} from "@/server/db/schema";

/**
 * The single row-level eligibility contract for ordinary public listing reads.
 * Callers must join every referenced table before applying these conditions.
 */
export function publicListingEligibilityConditions(): readonly SQL[] {
  return [
    eq(listings.status, "ACTIVE"),
    eq(sellerProfiles.status, "ACTIVE"),
    eq(users.status, "ACTIVE"),
    eq(categories.active, true),
    eq(countries.active, true),
    eq(cities.active, true),
    eq(areas.active, true),
  ];
}
