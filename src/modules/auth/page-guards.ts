import "server-only";

import { redirect } from "next/navigation";

import type { AppLocale } from "@/i18n/config";
import { requireVerified } from "@/server/authorization/policy";
import { loadSessionPrincipal } from "@/server/authorization/session";

export async function requireVerifiedPage(locale: AppLocale, returnTo: string) {
  const principal = await loadSessionPrincipal();
  if (!principal)
    redirect(`/${locale}/login?returnTo=${encodeURIComponent(returnTo)}`);
  if (!principal.emailVerified) redirect(`/${locale}/verify-email`);
  return requireVerified(principal);
}
