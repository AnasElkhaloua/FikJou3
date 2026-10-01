import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import type * as schema from "@/server/db/schema";

import { MarketplaceError } from "./errors";

export async function enforceMarketplaceRateLimit(
  database: NodePgDatabase<typeof schema>,
  input: Readonly<{
    action: string;
    actorId: string;
    limit: number;
    windowMs: number;
  }>,
) {
  const now = Date.now();
  const resetBefore = now - input.windowMs;
  const key = `marketplace:${input.action}:${input.actorId}`;
  const result = await database.execute<{ count: number }>(sql`
    insert into rate_limits (key, count, last_request)
    values (${key}, 1, ${now})
    on conflict (key) do update set
      count = case when rate_limits.last_request < ${resetBefore} then 1 else rate_limits.count + 1 end,
      last_request = case when rate_limits.last_request < ${resetBefore} then ${now} else rate_limits.last_request end
    returning count
  `);
  if (Number(result.rows[0]?.count ?? 0) > input.limit) {
    throw new MarketplaceError("RATE_LIMITED");
  }
}
