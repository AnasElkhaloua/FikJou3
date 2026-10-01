const moneyPattern = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/u;

export class MoneyValidationError extends Error {
  constructor(public readonly code: "FORMAT" | "NON_POSITIVE" | "TOO_LARGE") {
    super(code);
    this.name = "MoneyValidationError";
  }
}

export function normalizePositiveMoney(value: string): string {
  const trimmed = value.trim();
  if (!moneyPattern.test(trimmed)) throw new MoneyValidationError("FORMAT");
  const [integer = "", fraction = ""] = trimmed.split(".");
  if (integer.length > 10) throw new MoneyValidationError("TOO_LARGE");
  const normalized = `${integer}.${fraction.padEnd(2, "0")}`;
  if (/^0\.00$/u.test(normalized))
    throw new MoneyValidationError("NON_POSITIVE");
  return normalized;
}

export function normalizeOptionalPositiveMoney(value: string): string | null {
  return value.trim() === "" ? null : normalizePositiveMoney(value);
}
