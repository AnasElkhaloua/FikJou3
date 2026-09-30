import type { AppLocale } from "@/i18n/config";

export function safeAuthReturnPath(
  candidate: string | null | undefined,
  locale: AppLocale,
): string {
  const fallback = `/${locale}`;
  if (!candidate?.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate, "https://fikjou3.invalid");
  } catch {
    return fallback;
  }

  if (parsed.origin !== "https://fikjou3.invalid") {
    return fallback;
  }

  if (
    parsed.pathname !== `/${locale}` &&
    !parsed.pathname.startsWith(`/${locale}/`)
  ) {
    return fallback;
  }

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
