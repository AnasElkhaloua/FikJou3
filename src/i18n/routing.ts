import { defineRouting } from "next-intl/routing";

import { defaultLocale, localeCookieName, locales } from "./config";

export const routing = defineRouting({
  defaultLocale,
  localeCookie: {
    name: localeCookieName,
    path: "/",
    sameSite: "lax",
  },
  localeDetection: true,
  localePrefix: "always",
  locales,
});
