import type { AppLocale } from "./config";

const localeTags: Record<AppLocale, string> = {
  en: "en-MA",
  fr: "fr-MA",
};

export function formatMad(amount: number, locale: AppLocale): string {
  return new Intl.NumberFormat(localeTags[locale], {
    currency: "MAD",
    currencyDisplay: "code",
    style: "currency",
  }).format(amount);
}

export function formatDate(date: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(localeTags[locale], {
    dateStyle: "medium",
    timeZone: "Africa/Casablanca",
  }).format(date);
}
