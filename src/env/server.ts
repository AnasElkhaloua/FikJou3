import "server-only";

import { z } from "zod";

const serverEnvironmentSchema = z.object({
  APP_URL: z.url(),
  NODE_ENV: z.enum(["development", "test", "production"]),
});

export const serverEnv = Object.freeze(
  serverEnvironmentSchema.parse({
    APP_URL: process.env.APP_URL ?? "http://localhost:3000",
    NODE_ENV: process.env.NODE_ENV ?? "development",
  }),
);
