export type TextDirection = "ltr" | "rtl";

const rtlCharacterPattern = /[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufefc]/u;

export function inferTextDirection(value: string): TextDirection {
  return rtlCharacterPattern.test(value) ? "rtl" : "ltr";
}
