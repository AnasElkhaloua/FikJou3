import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "../src/server/db/schema";
import { seedReferenceData } from "../src/server/db/seed";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");
const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema });

try {
  await seedReferenceData(db);
  console.log("Reference data seeded.");
} finally {
  await pool.end();
}
