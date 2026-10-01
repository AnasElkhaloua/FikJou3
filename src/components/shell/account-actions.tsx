"use client";

import { LogIn, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { authClient } from "@/modules/auth/auth-client";
import { SignOutButton } from "@/modules/auth/sign-out-button";

export function AccountActions() {
  const t = useTranslations("Shell");
  const session = authClient.useSession();

  if (session.isPending) {
    return <span aria-hidden="true" className="account-skeleton" />;
  }

  if (!session.data) {
    return (
      <Link aria-label={t("login")} className="account-link" href="/login">
        <LogIn aria-hidden="true" size={18} strokeWidth={1.8} />
        <span>{t("login")}</span>
      </Link>
    );
  }

  const name = session.data.user.name.trim();
  const initial = name.charAt(0).toLocaleUpperCase() || "?";

  return (
    <div className="account-signed-in">
      <span aria-hidden="true" className="account-avatar">
        {initial}
      </span>
      <span className="account-name" dir="auto">
        {name}
      </span>
      <SignOutButton />
      <UserRound className="sr-only" />
    </div>
  );
}
