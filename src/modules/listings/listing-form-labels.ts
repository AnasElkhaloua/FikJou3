import type { getTranslations } from "next-intl/server";

export function listingFormLabels(
  t: Awaited<ReturnType<typeof getTranslations<"Listing.form">>>,
) {
  const keys = [
    "area",
    "category",
    "chooseArea",
    "chooseCategory",
    "chooseCity",
    "city",
    "currentImages",
    "delivery",
    "description",
    "fulfillment",
    "fulfillmentHint",
    "image",
    "imageHint",
    "images",
    "moveDown",
    "moveUp",
    "pickup",
    "price",
    "priceHint",
    "publish",
    "removeImage",
    "saveDraft",
    "saving",
    "title",
  ] as const;
  return Object.fromEntries(keys.map((key) => [key, t(key)])) as Record<
    (typeof keys)[number],
    string
  >;
}
