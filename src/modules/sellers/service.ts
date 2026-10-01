import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { MarketplaceError } from "@/modules/marketplace/errors";
import { enforceMarketplaceRateLimit } from "@/modules/marketplace/rate-limit";
import { createStableSlug } from "@/modules/listings/slug";
import {
  requireOwner,
  requireVerified,
  type Principal,
} from "@/server/authorization/policy";
import { areas, cities, sellerProfiles } from "@/server/db/schema";
import type * as schema from "@/server/db/schema";

import type { SellerInput } from "./validation";

export async function createSellerProfile(
  database: NodePgDatabase<typeof schema>,
  principal: Principal | null,
  input: SellerInput,
) {
  const actor = requireVerified(principal);
  await enforceMarketplaceRateLimit(database, {
    action: "seller-create",
    actorId: actor.userId,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  await assertActiveLocation(database, input.cityId, input.areaId);

  try {
    const [seller] = await database
      .insert(sellerProfiles)
      .values({
        ...input,
        slug: createStableSlug(input.displayName, "seller"),
        userId: actor.userId,
      })
      .returning({ id: sellerProfiles.id, slug: sellerProfiles.slug });
    if (!seller) throw new MarketplaceError("UNAVAILABLE");
    return seller;
  } catch (error) {
    if (isPostgresCode(error, "23505")) throw new MarketplaceError("CONFLICT");
    throw error;
  }
}

export async function updateSellerProfile(
  database: NodePgDatabase<typeof schema>,
  principal: Principal | null,
  sellerId: string,
  input: SellerInput,
) {
  const actor = requireVerified(principal);
  const [seller] = await database
    .select({ status: sellerProfiles.status, userId: sellerProfiles.userId })
    .from(sellerProfiles)
    .where(eq(sellerProfiles.id, sellerId))
    .limit(1);
  if (!seller) throw new MarketplaceError("NOT_FOUND");
  requireOwner(actor, seller.userId);
  if (seller.status === "SUSPENDED") throw new MarketplaceError("UNAVAILABLE");
  await assertActiveLocation(database, input.cityId, input.areaId);

  const [updated] = await database
    .update(sellerProfiles)
    .set({ ...input, updatedAt: new Date() })
    .where(
      and(
        eq(sellerProfiles.id, sellerId),
        eq(sellerProfiles.userId, actor.userId),
      ),
    )
    .returning({ id: sellerProfiles.id, slug: sellerProfiles.slug });
  if (!updated) throw new MarketplaceError("NOT_FOUND");
  return updated;
}

async function assertActiveLocation(
  database: NodePgDatabase<typeof schema>,
  cityId: string,
  areaId: string | null,
) {
  const [city] = await database
    .select({ id: cities.id })
    .from(cities)
    .where(and(eq(cities.id, cityId), eq(cities.active, true)))
    .limit(1);
  if (!city) throw new MarketplaceError("VALIDATION");
  if (areaId) {
    const [area] = await database
      .select({ id: areas.id })
      .from(areas)
      .where(
        and(
          eq(areas.id, areaId),
          eq(areas.cityId, cityId),
          eq(areas.active, true),
        ),
      )
      .limit(1);
    if (!area) throw new MarketplaceError("VALIDATION");
  }
}

function isPostgresCode(error: unknown, code: string): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && error.code === code) return true;
  return "cause" in error && isPostgresCode(error.cause, code);
}
