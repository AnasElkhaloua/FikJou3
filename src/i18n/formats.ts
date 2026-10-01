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

export function formatMadDecimal(value: string, locale: AppLocale): string {
  const [integer = "0", fraction = "00"] = value.split(".");
  const grouped = new Intl.NumberFormat(localeTags[locale], {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(BigInt(integer));
  let insertedInteger = false;
  return new Intl.NumberFormat(localeTags[locale], {
    currency: "MAD",
    currencyDisplay: "code",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  })
    .formatToParts(0)
    .map((part) => {
      if (part.type === "integer") {
        if (insertedInteger) return "";
        insertedInteger = true;
        return grouped;
      }
      if (part.type === "fraction") {
        return fraction.padEnd(2, "0").slice(0, 2);
      }
      return part.value;
    })
    .join("");
}

export function formatDate(date: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(localeTags[locale], {
    dateStyle: "medium",
    timeZone: "Africa/Casablanca",
  }).format(date);
}
