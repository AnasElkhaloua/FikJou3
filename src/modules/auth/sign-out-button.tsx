"use client";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

import { authClient } from "./auth-client";

export function SignOutButton() {
  const router = useRouter();
  const t = useTranslations("Auth");
  const session = authClient.useSession();

  if (!session.data) return null;

  return (
    <button
      className="text-button"
      onClick={async () => {
        await authClient.signOut();
        router.replace("/");
        router.refresh();
      }}
      type="button"
    >
      {t("signOut")}
    </button>
  );
}
