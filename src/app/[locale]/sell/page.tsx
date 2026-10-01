import type { Metadata } from "next";
import { Eye, Plus, Store } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/config";
import { routing } from "@/i18n/routing";
import { requireVerifiedPage } from "@/modules/auth/page-guards";
import { transitionListingAction } from "@/modules/listings/actions";
import { LifecycleActionForm } from "@/modules/listings/lifecycle-action-form";
import { getOwnedListings } from "@/modules/listings/queries";
import { listActiveLocationOptions } from "@/modules/locations/queries";
import {
  createSellerAction,
  updateSellerAction,
} from "@/modules/sellers/actions";
import { getSellerForUser } from "@/modules/sellers/queries";
import { SellerForm } from "@/modules/sellers/seller-form";
import { sellerFormLabels } from "@/modules/sellers/seller-form-labels";

export const metadata: Metadata = { robots: { follow: false, index: false } };

export default async function SellPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: requestedLocale } = await params;
  if (!hasLocale(routing.locales, requestedLocale)) notFound();
  const locale = requestedLocale as AppLocale;
  const principal = await requireVerifiedPage(locale, `/${locale}/sell`);
  const [t, formT, locations, seller] = await Promise.all([
    getTranslations({ locale, namespace: "Seller" }),
    getTranslations({ locale, namespace: "Seller.form" }),
    listActiveLocationOptions(locale),
    getSellerForUser(principal.userId),
  ]);

  if (!seller) {
    return (
      <main
        id="main-content"
        className="management-main page-container"
        tabIndex={-1}
      >
        <header className="management-heading">
          <Store aria-hidden="true" size={32} />
          <p className="eyebrow">{t("onboardingEyebrow")}</p>
          <h1>{t("onboardingTitle")}</h1>
          <p>{t("onboardingDescription")}</p>
        </header>
        <SellerForm
          action={createSellerAction.bind(null, locale)}
          areas={locations.areas}
          cities={locations.cities}
          labels={sellerFormLabels(formT)}
        />
      </main>
    );
  }

  const ownedListings = await getOwnedListings(principal.userId);
  const updateAction = updateSellerAction.bind(null, locale, seller.id);
  return (
    <main
      id="main-content"
      className="management-main page-container"
      tabIndex={-1}
    >
      <header className="management-heading dashboard-heading">
        <div>
          <p className="eyebrow">{t("dashboardEyebrow")}</p>
          <h1 dir="auto">{seller.displayName}</h1>
          <p>{t("dashboardDescription")}</p>
        </div>
        <div className="management-heading-actions">
          <Link className="secondary-link" href={`/seller/${seller.slug}`}>
            <Eye aria-hidden="true" size={18} /> {t("viewProfile")}
          </Link>
          <Link className="primary-link" href="/sell/new">
            <Plus aria-hidden="true" size={18} /> {t("addListing")}
          </Link>
        </div>
      </header>

      <section className="management-panel" aria-labelledby="listings-heading">
        <div className="section-heading">
          <div>
            <h2 id="listings-heading">{t("listingsTitle")}</h2>
            <p>{t("listingsDescription")}</p>
          </div>
        </div>
        {ownedListings.length ? (
          <div className="owned-listings">
            {ownedListings.map((listing) => (
              <article className="owned-listing-row" key={listing.id}>
                <div>
                  <span
                    className={`status-badge ${listing.status.toLowerCase()}`}
                  >
                    {t(`status.${listing.status}`)}
                  </span>
                  <h3 dir="auto">{listing.title}</h3>
                  <p>
                    {listing.priceAmount
                      ? `${listing.priceAmount} MAD`
                      : t("priceMissing")}
                  </p>
                </div>
                <div className="row-actions">
                  <Link
                    className="secondary-link"
                    href={`/sell/listings/${listing.id}/edit`}
                  >
                    {t("edit")}
                  </Link>
                  {listing.status === "ACTIVE" ? (
                    <LifecycleActionForm
                      action={transitionListingAction.bind(
                        null,
                        locale,
                        listing.id,
                        "pause",
                      )}
                      label={t("pause")}
                    />
                  ) : null}
                  {listing.status === "PAUSED" ? (
                    <LifecycleActionForm
                      action={transitionListingAction.bind(
                        null,
                        locale,
                        listing.id,
                        "reactivate",
                      )}
                      label={t("reactivate")}
                    />
                  ) : null}
                  {listing.status !== "REMOVED" ? (
                    <LifecycleActionForm
                      action={transitionListingAction.bind(
                        null,
                        locale,
                        listing.id,
                        "remove",
                      )}
                      confirmMessage={t("removeConfirm")}
                      danger
                      label={t("remove")}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="management-empty">
            <h3>{t("emptyTitle")}</h3>
            <p>{t("emptyDescription")}</p>
            <Link className="primary-link" href="/sell/new">
              {t("addListing")}
            </Link>
          </div>
        )}
      </section>

      <details className="management-panel profile-editor">
        <summary>{t("editProfile")}</summary>
        <SellerForm
          action={updateAction}
          areas={locations.areas}
          cities={locations.cities}
          labels={sellerFormLabels(formT)}
          value={seller}
        />
      </details>
    </main>
  );
}
