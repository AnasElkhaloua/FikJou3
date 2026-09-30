import "server-only";

import { headers } from "next/headers";

import { auth } from "@/modules/auth/auth";

import type { Principal } from "./policy";

export async function loadSessionPrincipal(): Promise<Principal | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const user = session.user as typeof session.user & {
    role: Principal["role"];
    status: Principal["status"];
  };

  return {
    emailVerified: user.emailVerified,
    role: user.role,
    status: user.status,
    userId: user.id,
  };
}
