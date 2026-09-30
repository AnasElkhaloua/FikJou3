"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import type { AppLocale } from "./config";
import { Link, usePathname } from "./navigation";
import { replaceLocalePrefix } from "./paths";

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("Shell");
  function localizedHref(targetLocale: AppLocale) {
    const localizedQuery = new URLSearchParams(searchParams);
    const returnTo = localizedQuery.get("returnTo");
    if (returnTo) {
      const localizedReturnTo = replaceLocalePrefix(
        returnTo,
        locale,
        targetLocale,
      );
      if (localizedReturnTo) localizedQuery.set("returnTo", localizedReturnTo);
    }
    const query = localizedQuery.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  return (
    <nav aria-label={t("language")} className="language-switcher">
      <Link
        aria-current={locale === "en" ? "page" : undefined}
        href={localizedHref("en")}
        locale="en"
      >
        EN
      </Link>
      <span aria-hidden="true">|</span>
      <Link
        aria-current={locale === "fr" ? "page" : undefined}
        href={localizedHref("fr")}
        locale="fr"
      >
        FR
      </Link>
    </nav>
  );
}
