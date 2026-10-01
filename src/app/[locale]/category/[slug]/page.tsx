import type { Metadata } from "next";
import { connection } from "next/server";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import type { AppLocale } from "@/i18n/config";
import { routing } from "@/i18n/routing";
import { listActiveCategories } from "@/modules/categories/queries";
import { DiscoveryPage } from "@/modules/discovery/discovery-page";
import type { RawDiscoveryParams } from "@/modules/discovery/params";

type Props = Readonly<{
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<RawDiscoveryParams>;
}>;

async function resolveCategory(locale: AppLocale, slug: string) {
  const categories = await listActiveCategories(locale);
  return categories.find((category) => category.slug === slug) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: requestedLocale, slug } = await params;
  if (!hasLocale(routing.locales, requestedLocale)) notFound();
  const locale = requestedLocale as AppLocale;
  const [category, t] = await Promise.all([
    resolveCategory(locale, slug),
    getTranslations({ locale, namespace: "Explore.categoryPage" }),
  ]);
  if (!category) notFound();
  const canonical = `/${locale}/category/${encodeURIComponent(slug)}`;
  return {
    alternates: {
      canonical,
      languages: {
        en: `/en/category/${encodeURIComponent(slug)}`,
        fr: `/fr/category/${encodeURIComponent(slug)}`,
        "x-default": `/en/category/${encodeURIComponent(slug)}`,
      },
    },
    description: t("metadataDescription", { category: category.name }),
    title: t("metadataTitle", { category: category.name }),
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  await connection();
  const [{ locale: requestedLocale, slug }, rawParams] = await Promise.all([
    params,
    searchParams,
  ]);
  if (!hasLocale(routing.locales, requestedLocale)) notFound();
  const locale = requestedLocale as AppLocale;
  const [category, t] = await Promise.all([
    resolveCategory(locale, slug),
    getTranslations({ locale, namespace: "Explore.categoryPage" }),
  ]);
  if (!category) notFound();

  return (
    <main
      id="main-content"
      className="explore-main page-container"
      tabIndex={-1}
    >
      <header className="explore-heading">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1>{category.name}</h1>
        <p>{t("description", { category: category.name })}</p>
      </header>
      <DiscoveryPage
        locale={locale}
        rawParams={{ ...rawParams, category: slug }}
      />
    </main>
  );
}
