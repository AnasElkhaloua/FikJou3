import type { Metadata } from "next";
import { ArrowRight, Store } from "lucide-react";
import { connection } from "next/server";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { CategoryList } from "@/components/marketplace/category-list";
import { ListingGrid } from "@/components/marketplace/listing-grid";
import { SearchShell } from "@/components/marketplace/search-shell";
import { SiteFooter } from "@/components/shell/site-footer";
import { loadMarketplacePreview } from "@/dev/load-marketplace-preview";
import { type AppLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { listActiveCategories } from "@/modules/categories/queries";

type PageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const canonical = `/${locale}`;

  return {
    alternates: {
      canonical,
      languages: { en: "/en", fr: "/fr", "x-default": "/en" },
    },
    description: t("homeDescription"),
    openGraph: {
      description: t("homeDescription"),
      title: t("homeTitle"),
      url: canonical,
    },
    title: t("homeTitle"),
  };
}

export default async function HomePage({ params }: PageProps) {
  await connection();
  const { locale: requestedLocale } = await params;
  if (!hasLocale(routing.locales, requestedLocale)) notFound();
  const locale = requestedLocale as AppLocale;
  const [t, categories, listings] = await Promise.all([
    getTranslations({ locale, namespace: "Home" }),
    listActiveCategories(locale),
    loadMarketplacePreview(),
  ]);

  const listingLabels = {
    delivery: t("card.delivery"),
    favoriteUnavailable: t("card.favoriteUnavailable"),
    imageUnavailable: t("card.imageUnavailable"),
    newSeller: t("card.newSeller"),
    pickup: t("card.pickup"),
    reviews: (count: number) => t("card.reviews", { count }),
  };

  return (
    <>
      <main id="main-content" className="home-main" tabIndex={-1}>
        <section
          className="discovery-intro page-container"
          aria-labelledby="home-title"
        >
          <div className="intro-copy">
            <p className="eyebrow">{t("eyebrow")}</p>
            <h1 id="home-title">{t("title")}</h1>
            <p>{t("description")}</p>
          </div>
          <SearchShell
            action={`/${locale}/explore`}
            labels={{
              location: t("search.location"),
              locationPlaceholder: t("search.locationPlaceholder"),
              query: t("search.query"),
              queryPlaceholder: t("search.queryPlaceholder"),
              submit: t("search.submit"),
            }}
          />
        </section>

        <section
          className="page-section page-container"
          aria-labelledby="categories-title"
        >
          <div className="section-heading">
            <div>
              <p className="section-kicker">{t("categories.kicker")}</p>
              <h2 id="categories-title">{t("categories.title")}</h2>
            </div>
          </div>
          <CategoryList categories={categories} />
        </section>

        <section
          className="page-section page-container"
          aria-labelledby="marketplace-title"
        >
          <div className="section-heading marketplace-heading">
            <div>
              <p className="section-kicker">{t("marketplace.kicker")}</p>
              <h2 id="marketplace-title">{t("marketplace.title")}</h2>
              <p>{t("marketplace.description")}</p>
            </div>
            <Link className="section-link" href="/explore">
              {t("marketplace.explore")}
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>
          {listings.length > 0 ? (
            <p className="preview-notice">{t("marketplace.previewNotice")}</p>
          ) : null}
          <ListingGrid
            empty={{
              action: t("empty.action"),
              description: t("empty.description"),
              title: t("empty.title"),
            }}
            labels={listingLabels}
            listings={listings}
            locale={locale}
          />
        </section>

        <section
          className="seller-cta page-container"
          aria-labelledby="seller-cta-title"
        >
          <Store aria-hidden="true" size={30} strokeWidth={1.5} />
          <div>
            <h2 id="seller-cta-title">{t("seller.title")}</h2>
            <p>{t("seller.description")}</p>
          </div>
          <Link className="primary-link" href="/register">
            {t("seller.action")}
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
