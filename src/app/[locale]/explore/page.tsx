import type { Metadata } from "next";
import { connection } from "next/server";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { type AppLocale } from "@/i18n/config";
import { routing } from "@/i18n/routing";
import { DiscoveryPage } from "@/modules/discovery/discovery-page";
import {
  parseDiscoveryParams,
  serializeDiscoveryParams,
  type RawDiscoveryParams,
} from "@/modules/discovery/params";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<RawDiscoveryParams>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Explore" });
  return {
    alternates: {
      canonical: `/${locale}/explore`,
      languages: {
        en: "/en/explore",
        fr: "/fr/explore",
        "x-default": "/en/explore",
      },
    },
    description: t("metadataDescription"),
    robots: { follow: true, index: false },
    title: t("metadataTitle"),
  };
}

export default async function ExplorePage({ params, searchParams }: Props) {
  await connection();
  const { locale: requestedLocale } = await params;
  if (!hasLocale(routing.locales, requestedLocale)) notFound();
  const locale = requestedLocale as AppLocale;
  const [t, rawParams] = await Promise.all([
    getTranslations({ locale, namespace: "Explore" }),
    searchParams,
  ]);
  const canonicalQuery = serializeDiscoveryParams(
    parseDiscoveryParams(rawParams).input,
  ).toString();
  const submittedQuery = new URLSearchParams();
  const allowedKeys = [
    "q",
    "city",
    "area",
    "category",
    "min",
    "max",
    "pickup",
    "delivery",
    "sort",
    "page",
  ] as const;
  for (const key of allowedKeys) {
    const value = rawParams[key];
    const first = typeof value === "string" ? value : value?.[0];
    if (first) submittedQuery.set(key, first);
  }
  const hasUnknownKey = Object.keys(rawParams).some(
    (key) => !allowedKeys.includes(key as (typeof allowedKeys)[number]),
  );
  if (hasUnknownKey || submittedQuery.toString() !== canonicalQuery) {
    redirect(
      canonicalQuery
        ? `/${locale}/explore?${canonicalQuery}`
        : `/${locale}/explore`,
    );
  }

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
      <DiscoveryPage locale={locale} rawParams={rawParams} />
    </main>
  );
}
