import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { serverEnv } from "@/env/server";

import * as schema from "./schema";

const globalDatabase = globalThis as typeof globalThis & {
  fikJou3Pool?: Pool;
};

export const pool =
  globalDatabase.fikJou3Pool ??
  new Pool({
    connectionString: serverEnv.DATABASE_URL,
    max: serverEnv.NODE_ENV === "production" ? 10 : 4,
  });

if (serverEnv.NODE_ENV !== "production") {
  globalDatabase.fikJou3Pool = pool;
}

export const db = drizzle(pool, { schema });
export type Database = typeof db;
