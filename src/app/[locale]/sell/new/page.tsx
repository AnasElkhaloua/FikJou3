import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import type { AppLocale } from "@/i18n/config";
import { routing } from "@/i18n/routing";
import { requireVerifiedPage } from "@/modules/auth/page-guards";
import { listActiveCategories } from "@/modules/categories/queries";
import { createListingAction } from "@/modules/listings/actions";
import { ListingForm } from "@/modules/listings/listing-form";
import { listingFormLabels } from "@/modules/listings/listing-form-labels";
import { listActiveLocationOptions } from "@/modules/locations/queries";
import { getSellerForUser } from "@/modules/sellers/queries";

export const metadata: Metadata = { robots: { follow: false, index: false } };

export default async function NewListingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: requestedLocale } = await params;
  if (!hasLocale(routing.locales, requestedLocale)) notFound();
  const locale = requestedLocale as AppLocale;
  const principal = await requireVerifiedPage(locale, `/${locale}/sell/new`);
  const seller = await getSellerForUser(principal.userId);
  if (!seller) redirect(`/${locale}/sell`);
  const [t, formT, categories, locations] = await Promise.all([
    getTranslations({ locale, namespace: "Listing" }),
    getTranslations({ locale, namespace: "Listing.form" }),
    listActiveCategories(locale),
    listActiveLocationOptions(locale),
  ]);
  return (
    <main
      id="main-content"
      className="management-main page-container"
      tabIndex={-1}
    >
      <header className="management-heading">
        <p className="eyebrow">{t("createEyebrow")}</p>
        <h1>{t("createTitle")}</h1>
        <p>{t("createDescription")}</p>
      </header>
      <ListingForm
        action={createListingAction.bind(null, locale)}
        areas={locations.areas}
        categories={categories}
        cities={locations.cities}
        labels={listingFormLabels(formT)}
      />
    </main>
  );
}
