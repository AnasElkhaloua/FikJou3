import type { getTranslations } from "next-intl/server";

export function sellerFormLabels(
  t: Awaited<ReturnType<typeof getTranslations<"Seller.form">>>,
) {
  return {
    area: t("area"),
    bio: t("bio"),
    bioHint: t("bioHint"),
    chooseArea: t("chooseArea"),
    chooseCity: t("chooseCity"),
    city: t("city"),
    contactPhone: t("contactPhone"),
    contactPreferences: t("contactPreferences"),
    create: t("create"),
    displayName: t("displayName"),
    phoneCalls: t("phoneCalls"),
    phoneHint: t("phoneHint"),
    platformMessages: t("platformMessages"),
    save: t("save"),
    saving: t("saving"),
    whatsApp: t("whatsApp"),
  };
}
