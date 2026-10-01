import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import type { AppLocale } from "@/i18n/config";
import { routing } from "@/i18n/routing";
import { requireVerifiedPage } from "@/modules/auth/page-guards";
import { listActiveCategories } from "@/modules/categories/queries";
import { updateListingAction } from "@/modules/listings/actions";
import { ListingForm } from "@/modules/listings/listing-form";
import { listingFormLabels } from "@/modules/listings/listing-form-labels";
import { getOwnedListingForEdit } from "@/modules/listings/queries";
import { listActiveLocationOptions } from "@/modules/locations/queries";

export const metadata: Metadata = { robots: { follow: false, index: false } };

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale: requestedLocale } = await params;
  if (!hasLocale(routing.locales, requestedLocale)) notFound();
  const locale = requestedLocale as AppLocale;
  const principal = await requireVerifiedPage(
    locale,
    `/${locale}/sell/listings/${id}/edit`,
  );
  const [listing, t, formT, categories, locations] = await Promise.all([
    getOwnedListingForEdit(principal.userId, id),
    getTranslations({ locale, namespace: "Listing" }),
    getTranslations({ locale, namespace: "Listing.form" }),
    listActiveCategories(locale),
    listActiveLocationOptions(locale),
  ]);
  if (!listing) notFound();
  return (
    <main
      id="main-content"
      className="management-main page-container"
      tabIndex={-1}
    >
      <header className="management-heading">
        <p className="eyebrow">{t("editEyebrow")}</p>
        <h1>{t("editTitle")}</h1>
        <p dir="auto">{listing.title}</p>
      </header>
      <ListingForm
        action={updateListingAction.bind(null, locale, listing.id)}
        areas={locations.areas}
        categories={categories}
        cities={locations.cities}
        labels={listingFormLabels(formT)}
        value={listing}
      />
    </main>
  );
}
