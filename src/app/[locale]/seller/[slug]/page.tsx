import type { Metadata } from "next";
import { CalendarDays, MapPin, Store } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import type { AppLocale } from "@/i18n/config";
import { ListingGrid } from "@/components/marketplace/listing-grid";
import { routing } from "@/i18n/routing";
import { getPublicSellerBySlug } from "@/modules/sellers/queries";

type Props = Readonly<{ params: Promise<{ locale: string; slug: string }> }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: requestedLocale, slug } = await params;
  if (!hasLocale(routing.locales, requestedLocale)) notFound();
  const locale = requestedLocale as AppLocale;
  const decodedSlug = decodeSlug(slug);
  const seller = await getPublicSellerBySlug(locale, decodedSlug);
  if (!seller) return { robots: { follow: false, index: false } };
  const t = await getTranslations({ locale, namespace: "Seller.public" });
  const encodedSlug = encodeURIComponent(decodedSlug);
  const canonical = `/${locale}/seller/${encodedSlug}`;
  return {
    alternates: {
      canonical,
      languages: {
        en: `/en/seller/${encodedSlug}`,
        fr: `/fr/seller/${encodedSlug}`,
        "x-default": `/en/seller/${encodedSlug}`,
      },
    },
    description: t("metadataDescription", {
      location: seller.areaName ?? seller.cityName,
      seller: seller.displayName,
    }),
    title: seller.displayName,
  };
}

export default async function PublicSellerPage({ params }: Props) {
  const { locale: requestedLocale, slug } = await params;
  if (!hasLocale(routing.locales, requestedLocale)) notFound();
  const locale = requestedLocale as AppLocale;
  const decodedSlug = decodeSlug(slug);
  const [seller, t] = await Promise.all([
    getPublicSellerBySlug(locale, decodedSlug),
    getTranslations({ locale, namespace: "Seller.public" }),
  ]);
  if (!seller) notFound();
  const location = seller.areaName ?? seller.cityName;

  return (
    <main
      id="main-content"
      className="seller-public-main page-container"
      tabIndex={-1}
    >
      <header className="seller-public-header">
        <div className="seller-avatar">
          <Store aria-hidden="true" size={34} />
        </div>
        <div>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 dir="auto">{seller.displayName}</h1>
          <p>
            <MapPin aria-hidden="true" size={17} /> {location}
          </p>
          <p>
            <CalendarDays aria-hidden="true" size={17} />{" "}
            {t("memberSince", {
              date: new Intl.DateTimeFormat(locale, {
                month: "long",
                year: "numeric",
              }).format(seller.createdAt),
            })}
          </p>
        </div>
      </header>
      {seller.bio ? (
        <section className="seller-bio" aria-labelledby="bio-heading">
          <h2 id="bio-heading">{t("about")}</h2>
          <p className="authored-copy" dir="auto">
            {seller.bio}
          </p>
        </section>
      ) : null}
      <section
        className="seller-listings"
        aria-labelledby="seller-listings-heading"
      >
        <div className="section-heading">
          <div>
            <p className="section-kicker">{t("listingsKicker")}</p>
            <h2 id="seller-listings-heading">{t("listingsTitle")}</h2>
            <p>{t("newSeller")}</p>
          </div>
        </div>
        <ListingGrid
          empty={{
            action: t("emptyAction"),
            description: t("emptyDescription"),
            href: "/explore",
            title: t("emptyTitle"),
          }}
          labels={{
            delivery: t("delivery"),
            favoriteUnavailable: t("favoriteUnavailable"),
            imageUnavailable: t("imageUnavailable"),
            newSeller: t("newSeller"),
            pickup: t("pickup"),
            reviews: (count) => t("reviews", { count }),
          }}
          listings={seller.listings.map((listing) => ({
            categorySlug: listing.categorySlug,
            fulfillment: [
              ...(listing.pickupAvailable ? (["pickup"] as const) : []),
              ...(listing.deliveryAvailable ? (["delivery"] as const) : []),
            ],
            href: `/listing/${listing.slug}`,
            id: listing.id,
            image: listing.coverUrl
              ? {
                  alt: listing.title,
                  position: "center",
                  src: listing.coverUrl,
                }
              : null,
            location: listing.location,
            priceAmount: listing.priceAmount!,
            rating: null,
            reviewCount: 0,
            sellerName: seller.displayName,
            title: listing.title,
          }))}
          locale={locale}
        />
      </section>
    </main>
  );
}

function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    notFound();
  }
}
