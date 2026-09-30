"use client";

import {
  Compass,
  Heart,
  Home,
  MessageCircle,
  Plus,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

import { isNavigationCurrent, mobileNavigation } from "./navigation";

const icons = {
  explore: Compass,
  favorites: Heart,
  home: Home,
  messages: MessageCircle,
  profile: UserRound,
  sell: Plus,
} as const;

export function MobileNavigation() {
  const pathname = usePathname();
  const t = useTranslations("Navigation");

  return (
    <nav aria-label={t("mobileLabel")} className="mobile-navigation">
      {mobileNavigation.map((item) => {
        const Icon = icons[item.destination];
        const content = (
          <>
            <span
              aria-hidden="true"
              className={item.destination === "sell" ? "sell-icon" : undefined}
            >
              <Icon size={20} strokeWidth={1.9} />
            </span>
            <span>{t(item.destination)}</span>
          </>
        );

        return item.href ? (
          <Link
            aria-current={
              isNavigationCurrent(pathname, item.href) ? "page" : undefined
            }
            href={item.href}
            key={item.destination}
          >
            {content}
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="mobile-nav-disabled"
            key={item.destination}
            title={t("comingSoon")}
          >
            {content}
          </span>
        );
      })}
    </nav>
  );
}
