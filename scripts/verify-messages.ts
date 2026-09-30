import en from "../src/i18n/messages/en.json";
import fr from "../src/i18n/messages/fr.json";

function keys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    keys(child, prefix ? `${prefix}.${key}` : key),
  );
}

const enKeys = keys(en).sort();
const frKeys = keys(fr).sort();

if (JSON.stringify(enKeys) !== JSON.stringify(frKeys)) {
  const missingInFrench = enKeys.filter((key) => !frKeys.includes(key));
  const extraInFrench = frKeys.filter((key) => !enKeys.includes(key));
  throw new Error(
    `EN/FR key mismatch. Missing FR: ${missingInFrench.join(", ")}; extra FR: ${extraInFrench.join(", ")}`,
  );
}

console.log(`EN/FR message parity verified (${enKeys.length} leaf keys).`);
