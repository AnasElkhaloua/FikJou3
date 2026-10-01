import { randomUUID } from "node:crypto";

export function slugBase(
  value: string,
  fallback: "listing" | "seller",
): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 64)
    .replace(/-+$/u, "");
  return normalized || fallback;
}

export function createStableSlug(
  value: string,
  fallback: "listing" | "seller",
): string {
  return `${slugBase(value, fallback)}-${randomUUID().slice(0, 8)}`;
}
