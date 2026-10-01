import type { Metadata } from "next";
import { MapPin, PackageOpen, Store } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import type { AppLocale } from "@/i18n/config";
import { formatMadDecimal } from "@/i18n/formats";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getPublicListingBySlug } from "@/modules/listings/queries";

type Props = Readonly<{ params: Promise<{ locale: string; slug: string }> }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: requestedLocale, slug } = await params;
  if (!hasLocale(routing.locales, requestedLocale)) notFound();
  const locale = requestedLocale as AppLocale;
  const decodedSlug = decodeSlug(slug);
  const listing = await getPublicListingBySlug(locale, decodedSlug);
  if (!listing) return { robots: { follow: false, index: false } };
  const t = await getTranslations({ locale, namespace: "Listing.public" });
  const encodedSlug = encodeURIComponent(decodedSlug);
  const canonical = `/${locale}/listing/${encodedSlug}`;
  return {
    alternates: {
      canonical,
      languages: {
        en: `/en/listing/${encodedSlug}`,
        fr: `/fr/listing/${encodedSlug}`,
        "x-default": `/en/listing/${encodedSlug}`,
      },
    },
    description: t("metadataDescription", {
      location: listing.location,
      seller: listing.sellerDisplayName,
    }),
    openGraph: {
      description: listing.description,
      images: [listing.images[0]!.deliveryUrl],
      title: listing.title,
      type: "website",
      url: canonical,
    },
    title: listing.title,
  };
}

export default async function PublicListingPage({ params }: Props) {
  const { locale: requestedLocale, slug } = await params;
  if (!hasLocale(routing.locales, requestedLocale)) notFound();
  const locale = requestedLocale as AppLocale;
  const decodedSlug = decodeSlug(slug);
  const [listing, t] = await Promise.all([
    getPublicListingBySlug(locale, decodedSlug),
    getTranslations({ locale, namespace: "Listing.public" }),
  ]);
  if (!listing) notFound();

  return (
    <main
      id="main-content"
      className="listing-detail-main page-container"
      tabIndex={-1}
    >
      <div className="listing-gallery" aria-label={t("galleryLabel")}>
        {listing.images.map((image, index) => (
          // eslint-disable-next-line @next/next/no-img-element -- storage adapter provides runtime URLs
          <img
            alt={
              index === 0 ? listing.title : `${listing.title} — ${index + 1}`
            }
            key={image.id}
            src={image.deliveryUrl}
          />
        ))}
      </div>
      <div className="listing-detail-layout">
        <article className="listing-detail-copy">
          <p className="eyebrow">{listing.categoryName}</p>
          <h1 dir="auto">{listing.title}</h1>
          <p className="listing-detail-price">
            {formatMadDecimal(listing.priceAmount, locale)}
          </p>
          <p className="listing-detail-location">
            <MapPin aria-hidden="true" size={19} /> {listing.location}
          </p>
          <div className="fulfillment-list detail">
            {listing.pickupAvailable ? <span>{t("pickup")}</span> : null}
            {listing.deliveryAvailable ? <span>{t("delivery")}</span> : null}
          </div>
          <section aria-labelledby="description-heading">
            <h2 id="description-heading">{t("description")}</h2>
            <p className="authored-copy" dir="auto">
              {listing.description}
            </p>
          </section>
        </article>
        <aside className="seller-summary">
          <Store aria-hidden="true" size={28} />
          <p className="section-kicker">{t("seller")}</p>
          <h2 dir="auto">{listing.sellerDisplayName}</h2>
          <p>{t("newSeller")}</p>
          <Link
            className="secondary-link"
            href={`/seller/${listing.sellerSlug}`}
          >
            {t("viewSeller")}
          </Link>
          <div className="contact-coming">
            <PackageOpen aria-hidden="true" size={20} />
            <p>{t("contactComing")}</p>
          </div>
        </aside>
      </div>
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
