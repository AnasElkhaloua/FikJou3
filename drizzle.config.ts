import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./src/server/db/schema.ts",
  strict: true,
  verbose: true,
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@127.0.0.1:5432/fikjou3",
  },
});
