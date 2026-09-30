export const locales = ["en", "fr"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";

export const localeCookieName = "FIK_LOCALE";

export function isAppLocale(value: string): value is AppLocale {
  return locales.some((locale) => locale === value);
}
