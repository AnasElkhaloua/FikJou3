"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import type { MarketplaceActionState } from "@/modules/marketplace/action-state";
import { MarketplaceError } from "@/modules/marketplace/errors";
import { imageStorage } from "@/modules/storage/storage";
import { ImageValidationError } from "@/modules/storage/image-processing";
import { loadSessionPrincipal } from "@/server/authorization/session";
import { db } from "@/server/db/client";
import type { AppLocale } from "@/i18n/config";

import type { ListingTransition } from "./lifecycle";
import {
  createListing,
  transitionListing,
  updateListing,
  type UploadedImageInput,
} from "./service";
import { listingInputFromFormData } from "./validation";

export async function createListingAction(
  locale: AppLocale,
  _previous: MarketplaceActionState,
  formData: FormData,
): Promise<MarketplaceActionState> {
  const t = await getTranslations({ locale, namespace: "Listing.form" });
  const parsed = listingInputFromFormData(formData);
  if (!parsed.success)
    return { message: t("validationError"), status: "error" };
  let publishedSlug: string | null = null;
  try {
    const listing = await createListing(
      db,
      imageStorage,
      await loadSessionPrincipal(),
      parsed.data,
      await filesFromFormData(formData),
    );
    revalidatePath(`/${locale}/sell`);
    if (parsed.data.intent === "publish") publishedSlug = listing.slug;
  } catch (error) {
    return { message: listingMessage(error, t), status: "error" };
  }
  if (publishedSlug)
    redirect(`/${locale}/listing/${encodeURIComponent(publishedSlug)}`);
  redirect(`/${locale}/sell`);
}

export async function updateListingAction(
  locale: AppLocale,
  listingId: string,
  _previous: MarketplaceActionState,
  formData: FormData,
): Promise<MarketplaceActionState> {
  const t = await getTranslations({ locale, namespace: "Listing.form" });
  const parsed = listingInputFromFormData(formData);
  if (!parsed.success)
    return { message: t("validationError"), status: "error" };
  try {
    const listing = await updateListing(
      db,
      imageStorage,
      await loadSessionPrincipal(),
      listingId,
      parsed.data,
      await filesFromFormData(formData),
      formData.getAll("removeImageId").map(String),
      formData.getAll("imageOrder").map(String),
    );
    revalidatePath(`/${locale}/sell`);
    revalidatePath(`/${locale}/listing/${listing.slug}`);
  } catch (error) {
    return { message: listingMessage(error, t), status: "error" };
  }
  return { message: t("saved"), status: "success" };
}

export async function transitionListingAction(
  locale: AppLocale,
  listingId: string,
  transition: ListingTransition,
) {
  await transitionListing(
    db,
    await loadSessionPrincipal(),
    listingId,
    transition,
  );
  revalidatePath(`/${locale}/sell`);
  redirect(`/${locale}/sell`);
}

async function filesFromFormData(
  formData: FormData,
): Promise<UploadedImageInput[]> {
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);
  return Promise.all(
    files.map(async (file) => ({
      buffer: Buffer.from(await file.arrayBuffer()),
      declaredMimeType: file.type,
    })),
  );
}

function listingMessage(
  error: unknown,
  t: Awaited<ReturnType<typeof getTranslations<"Listing.form">>>,
) {
  if (error instanceof ImageValidationError) return t("imageError");
  if (error instanceof MarketplaceError && error.code === "RATE_LIMITED")
    return t("rateLimited");
  if (error instanceof MarketplaceError && error.code === "INVALID_STATE")
    return t("invalidState");
  if (error instanceof MarketplaceError && error.code === "VALIDATION")
    return t("validationError");
  return t("error");
}
