import type { Metadata } from "next";
import { connection } from "next/server";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { CategoryList } from "@/components/marketplace/category-list";
import { SearchShell } from "@/components/marketplace/search-shell";
import { EmptyState } from "@/components/marketplace/states";
import { type AppLocale } from "@/i18n/config";
import { routing } from "@/i18n/routing";
import { listActiveCategories } from "@/modules/categories/queries";

export const metadata: Metadata = {
  robots: { follow: true, index: false },
};

export default async function ExplorePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await connection();
  const { locale: requestedLocale } = await params;
  if (!hasLocale(routing.locales, requestedLocale)) notFound();
  const locale = requestedLocale as AppLocale;
  const [t, categories] = await Promise.all([
    getTranslations({ locale, namespace: "Explore" }),
    listActiveCategories(locale),
  ]);

  return (
    <main
      id="main-content"
      className="explore-main page-container"
      tabIndex={-1}
    >
      <header className="explore-heading">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1>{t("title")}</h1>
        <p>{t("description")}</p>
      </header>
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
      <section
        className="explore-categories"
        aria-labelledby="explore-categories-title"
      >
        <h2 id="explore-categories-title">{t("categories")}</h2>
        <CategoryList categories={categories} />
      </section>
      <EmptyState
        action={t("empty.action")}
        description={t("empty.description")}
        href="/"
        title={t("empty.title")}
      />
    </main>
  );
}
