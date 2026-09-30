import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import * as schema from "../src/server/db/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");
const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema });

try {
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Database migrations applied.");
} finally {
  await pool.end();
}
