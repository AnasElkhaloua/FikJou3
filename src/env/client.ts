import { z } from "zod";

const clientEnvironmentSchema = z.object({
  appName: z.string().trim().min(1).max(80),
});

export const clientEnv = Object.freeze(
  clientEnvironmentSchema.parse({
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Fik Jou3?",
  }),
);
