import { randomUUID } from "node:crypto";

const storageKeyPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export function createStorageKey(): string {
  return randomUUID();
}

export function isStorageKey(value: string): boolean {
  return storageKeyPattern.test(value);
}
