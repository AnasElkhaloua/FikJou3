import { Heart, ImageOff, MapPin, Star } from "lucide-react";

import type { AppLocale } from "@/i18n/config";
import { formatMad } from "@/i18n/formats";

import type { ListingCardView } from "./listing-card-types";

type ListingCardProps = Readonly<{
  labels: {
    delivery: string;
    favoriteUnavailable: string;
    imageUnavailable: string;
    newSeller: string;
    pickup: string;
    reviews: (count: number) => string;
  };
  listing: ListingCardView;
  locale: AppLocale;
}>;

const imagePosition = {
  center: "50% 50%",
  end: "100% 50%",
  start: "0% 50%",
} as const;

export function ListingCard({ labels, listing, locale }: ListingCardProps) {
  return (
    <article className="listing-card" data-preview-listing={listing.id}>
      <div className="listing-media">
        {listing.image ? (
          <div
            aria-label={listing.image.alt}
            className="listing-photo"
            role="img"
            style={{
              backgroundImage: `url(${listing.image.src})`,
              backgroundPosition: imagePosition[listing.image.position],
            }}
          />
        ) : (
          <div
            className="listing-image-fallback"
            role="img"
            aria-label={labels.imageUnavailable}
          >
            <ImageOff aria-hidden="true" size={24} strokeWidth={1.5} />
            <span>{labels.imageUnavailable}</span>
          </div>
        )}
        <button
          aria-label={labels.favoriteUnavailable}
          className="favorite-button"
          disabled
          title={labels.favoriteUnavailable}
          type="button"
        >
          <Heart aria-hidden="true" size={20} strokeWidth={1.9} />
        </button>
      </div>
      <div className="listing-body">
        <div className="listing-heading-row">
          <h3 dir="auto">{listing.title}</h3>
          <strong>{formatMad(Number(listing.priceAmount), locale)}</strong>
        </div>
        <p className="seller-name" dir="auto">
          {listing.sellerName}
        </p>
        <div className="listing-context">
          <span className="location-label" dir="auto">
            <MapPin aria-hidden="true" size={15} strokeWidth={1.8} />
            {listing.location}
          </span>
          {listing.rating === null ? (
            <span className="new-seller">{labels.newSeller}</span>
          ) : (
            <span
              aria-label={`${listing.rating.toFixed(1)}, ${labels.reviews(listing.reviewCount)}`}
              className="rating-label"
            >
              <Star aria-hidden="true" fill="currentColor" size={14} />
              {listing.rating.toFixed(1)}
              <span>({listing.reviewCount})</span>
            </span>
          )}
        </div>
        <div className="fulfillment-list">
          {listing.fulfillment.map((mode) => (
            <span key={mode}>
              {mode === "pickup" ? labels.pickup : labels.delivery}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
