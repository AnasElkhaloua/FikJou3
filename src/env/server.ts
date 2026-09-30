import "server-only";

import { z } from "zod";

const serverEnvironmentSchema = z.object({
  APP_URL: z.url(),
  AUTH_TRUSTED_IP_HEADER: z
    .enum(["x-forwarded-for", "x-real-ip"])
    .default("x-forwarded-for"),
  BETTER_AUTH_SECRET: z.string().min(32),
  DATABASE_URL: z.string().min(1),
  DEV_EMAIL_OUTBOX_DIR: z.string().min(1).default(".tmp/email-outbox"),
  EMAIL_DELIVERY_MODE: z.enum(["development", "provider"]),
  FIK_MARKETPLACE_PREVIEW: z.enum(["populated", "empty"]),
  NODE_ENV: z.enum(["development", "test", "production"]),
});

const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";

export const serverEnv = Object.freeze(
  serverEnvironmentSchema.parse({
    APP_URL: process.env.APP_URL ?? "http://localhost:3000",
    AUTH_TRUSTED_IP_HEADER: process.env.AUTH_TRUSTED_IP_HEADER,
    BETTER_AUTH_SECRET:
      process.env.BETTER_AUTH_SECRET ??
      (isProductionBuild || process.env.NODE_ENV !== "production"
        ? "development-only-secret-change-before-deploy"
        : undefined),
    DATABASE_URL:
      process.env.DATABASE_URL ??
      (isProductionBuild || process.env.NODE_ENV !== "production"
        ? "postgresql://postgres:postgres@127.0.0.1:5432/fikjou3"
        : undefined),
    DEV_EMAIL_OUTBOX_DIR: process.env.DEV_EMAIL_OUTBOX_DIR,
    EMAIL_DELIVERY_MODE:
      process.env.EMAIL_DELIVERY_MODE ??
      (isProductionBuild || process.env.NODE_ENV !== "production"
        ? "development"
        : undefined),
    FIK_MARKETPLACE_PREVIEW:
      process.env.FIK_MARKETPLACE_PREVIEW ??
      (process.env.NODE_ENV === "development" ? "populated" : "empty"),
    NODE_ENV: process.env.NODE_ENV ?? "development",
  }),
);

if (
  serverEnv.NODE_ENV === "production" &&
  !isProductionBuild &&
  serverEnv.EMAIL_DELIVERY_MODE === "development"
) {
  throw new Error(
    "Development email delivery is forbidden in the production runtime.",
  );
}

if (
  serverEnv.NODE_ENV === "production" &&
  serverEnv.FIK_MARKETPLACE_PREVIEW === "populated"
) {
  throw new Error(
    "Development marketplace preview fixtures are forbidden in production.",
  );
}
