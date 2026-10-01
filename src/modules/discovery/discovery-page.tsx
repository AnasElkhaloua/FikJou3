import { AlertCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";

import {
  ActiveFilters,
  DiscoveryControls,
} from "@/components/marketplace/discovery-controls";
import { DiscoveryPagination } from "@/components/marketplace/discovery-pagination";
import { ListingGrid } from "@/components/marketplace/listing-grid";
import type { AppLocale } from "@/i18n/config";
import { listActiveCategories } from "@/modules/categories/queries";
import { listActiveLocationOptions } from "@/modules/locations/queries";

import { parseDiscoveryParams, type RawDiscoveryParams } from "./params";
import { discoverListings } from "./queries";

export async function DiscoveryPage({
  locale,
  rawParams,
}: Readonly<{ locale: AppLocale; rawParams: RawDiscoveryParams }>) {
  const parsed = parseDiscoveryParams(rawParams);
  const [t, categories, locations, result] = await Promise.all([
    getTranslations({ locale, namespace: "Explore" }),
    listActiveCategories(locale),
    listActiveLocationOptions(locale),
    discoverListings(locale, parsed.input),
  ]);
  const issues = [...new Set([...parsed.issues, ...result.issues])];
  const labels = {
    allAreas: t("filters.allAreas"),
    allCategories: t("filters.allCategories"),
    allCities: t("filters.allCities"),
    apply: t("filters.apply"),
    area: t("filters.area"),
    category: t("filters.category"),
    city: t("filters.city"),
    clearAll: t("filters.clearAll"),
    delivery: t("filters.delivery"),
    filters: t("filters.label"),
    maxPrice: t("filters.maxPrice"),
    minPrice: t("filters.minPrice"),
    pickup: t("filters.pickup"),
    query: t("search.query"),
    queryPlaceholder: t("search.queryPlaceholder"),
    search: t("search.submit"),
    sort: t("sort.label"),
    sortNewest: t("sort.newest"),
    sortPriceAsc: t("sort.priceAsc"),
    sortPriceDesc: t("sort.priceDesc"),
  };
  const cardLabels = {
    delivery: t("card.delivery"),
    favoriteUnavailable: t("card.favoriteUnavailable"),
    imageUnavailable: t("card.imageUnavailable"),
    newSeller: t("card.newSeller"),
    pickup: t("card.pickup"),
    reviews: (count: number) => t("card.reviews", { count }),
  };
  const hasFilters = Boolean(
    result.input.query ||
    result.input.city ||
    result.input.area ||
    result.input.category ||
    result.input.minPrice ||
    result.input.maxPrice ||
    result.input.pickup ||
    result.input.delivery,
  );
  return (
    <>
      <DiscoveryControls
        action={`/${locale}/explore`}
        areas={locations.areas}
        categories={categories}
        cities={locations.cities}
        input={result.input}
        labels={labels}
      />
      <ActiveFilters
        action={`/${locale}/explore`}
        areas={locations.areas}
        categories={categories}
        cities={locations.cities}
        input={result.input}
        labels={labels}
      />
      {issues.length ? (
        <p className="discovery-notice" role="status">
          <AlertCircle aria-hidden="true" size={18} />
          {t("invalidParameters")}
        </p>
      ) : null}
      <div className="discovery-results-heading">
        <div>
          <p className="section-kicker">{t("results.kicker")}</p>
          <h2>{t("results.title")}</h2>
        </div>
        <p aria-live="polite">{t("results.count", { count: result.total })}</p>
      </div>
      <ListingGrid
        empty={{
          action: hasFilters ? t("empty.clear") : t("empty.action"),
          description: hasFilters
            ? t("empty.filteredDescription")
            : t("empty.description"),
          href: hasFilters ? "/explore" : "/register",
          title: hasFilters ? t("empty.filteredTitle") : t("empty.title"),
        }}
        labels={cardLabels}
        listings={result.listings}
        locale={locale}
      />
      <DiscoveryPagination
        input={result.input}
        labels={{
          label: t("pagination.label"),
          next: t("pagination.next"),
          page: t("pagination.page", {
            count: result.pageCount,
            page: result.input.page,
          }),
          previous: t("pagination.previous"),
        }}
        pageCount={result.pageCount}
      />
    </>
  );
}
