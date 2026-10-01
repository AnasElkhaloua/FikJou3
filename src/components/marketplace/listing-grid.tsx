import type { AppLocale } from "@/i18n/config";

import { EmptyState } from "./states";
import { ListingCard } from "./listing-card";
import type { ListingCardView } from "./listing-card-types";

type ListingGridProps = Readonly<{
  empty: {
    action: string;
    description: string;
    href?: "/" | "/explore" | "/register";
    title: string;
  };
  labels: Parameters<typeof ListingCard>[0]["labels"];
  listings: readonly ListingCardView[];
  locale: AppLocale;
}>;

export function ListingGrid({
  empty,
  labels,
  listings,
  locale,
}: ListingGridProps) {
  if (listings.length === 0) {
    return <EmptyState {...empty} href={empty.href ?? "/register"} />;
  }

  return (
    <div className="listing-grid">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          labels={labels}
          listing={listing}
          locale={locale}
        />
      ))}
    </div>
  );
}
