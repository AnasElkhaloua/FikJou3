"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import type { MarketplaceActionState } from "@/modules/marketplace/action-state";
import { MarketplaceError } from "@/modules/marketplace/errors";
import { loadSessionPrincipal } from "@/server/authorization/session";
import { db } from "@/server/db/client";
import type { AppLocale } from "@/i18n/config";

import { createSellerProfile, updateSellerProfile } from "./service";
import { sellerInputFromFormData } from "./validation";

export async function createSellerAction(
  locale: AppLocale,
  _previous: MarketplaceActionState,
  formData: FormData,
): Promise<MarketplaceActionState> {
  const t = await getTranslations({ locale, namespace: "Seller.form" });
  const parsed = sellerInputFromFormData(formData);
  if (!parsed.success)
    return { message: t("validationError"), status: "error" };
  try {
    await createSellerProfile(db, await loadSessionPrincipal(), parsed.data);
  } catch (error) {
    return { message: marketplaceMessage(error, t), status: "error" };
  }
  revalidatePath(`/${locale}/sell`);
  redirect(`/${locale}/sell`);
}

export async function updateSellerAction(
  locale: AppLocale,
  sellerId: string,
  _previous: MarketplaceActionState,
  formData: FormData,
): Promise<MarketplaceActionState> {
  const t = await getTranslations({ locale, namespace: "Seller.form" });
  const parsed = sellerInputFromFormData(formData);
  if (!parsed.success)
    return { message: t("validationError"), status: "error" };
  try {
    await updateSellerProfile(
      db,
      await loadSessionPrincipal(),
      sellerId,
      parsed.data,
    );
  } catch (error) {
    return { message: marketplaceMessage(error, t), status: "error" };
  }
  revalidatePath(`/${locale}/sell`);
  return { message: t("saved"), status: "success" };
}

function marketplaceMessage(
  error: unknown,
  t: Awaited<ReturnType<typeof getTranslations<"Seller.form">>>,
) {
  if (error instanceof MarketplaceError && error.code === "CONFLICT")
    return t("duplicate");
  if (error instanceof MarketplaceError && error.code === "RATE_LIMITED")
    return t("rateLimited");
  return t("error");
}
