import type { AppLocale } from "./config";

export function replaceLocalePrefix(
  path: string,
  from: AppLocale,
  to: AppLocale,
): string | null {
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  const prefix = `/${from}`;
  if (path !== prefix && !path.startsWith(`${prefix}/`)) return null;
  return `/${to}${path.slice(prefix.length)}`;
}
