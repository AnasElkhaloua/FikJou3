import "server-only";

import { serverEnv } from "@/env/server";
import { db } from "@/server/db/client";
import { emailSender } from "@/server/email";

import { createAuth } from "./create-auth";

export const auth = createAuth({
  baseURL: serverEnv.APP_URL,
  database: db,
  emailSender,
  ipAddressHeader: serverEnv.AUTH_TRUSTED_IP_HEADER,
  production: serverEnv.NODE_ENV === "production",
  secret: serverEnv.BETTER_AUTH_SECRET,
});

export type AuthSession = typeof auth.$Infer.Session;
