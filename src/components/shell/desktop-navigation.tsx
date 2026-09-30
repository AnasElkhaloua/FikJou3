"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

import { desktopNavigation, isNavigationCurrent } from "./navigation";

export function DesktopNavigation() {
  const pathname = usePathname();
  const t = useTranslations("Navigation");

  return (
    <nav aria-label={t("primaryLabel")} className="desktop-navigation">
      {desktopNavigation.map((item) =>
        item.href ? (
          <Link
            aria-current={
              isNavigationCurrent(pathname, item.href) ? "page" : undefined
            }
            href={item.href}
            key={item.destination}
          >
            {t(item.destination)}
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="navigation-disabled"
            key={item.destination}
            title={t("comingSoon")}
          >
            {t(item.destination)}
          </span>
        ),
      )}
    </nav>
  );
}
