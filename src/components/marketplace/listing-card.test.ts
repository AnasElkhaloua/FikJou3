import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ListingCard } from "./listing-card";
import type { ListingCardView } from "./listing-card-types";

const labels = {
  delivery: "Delivery",
  favoriteUnavailable: "Favorites unavailable",
  imageUnavailable: "Food photo coming soon",
  newSeller: "New cook",
  pickup: "Pickup",
  reviews: (count: number) => `${count} reviews`,
};

const baseListing: ListingCardView = {
  categorySlug: "moroccan",
  fulfillment: ["pickup", "delivery"],
  id: "card-test",
  image: null,
  location: "A deliberately long neighborhood name, Casablanca",
  priceAmount: "65.00",
  rating: null,
  reviewCount: 0,
  sellerName: "مطبخ أمينة / Cuisine Amina",
  title: "Pastilla au poulet maison avec une recette familiale très généreuse",
};

describe("ListingCard", () => {
  it("renders authored mixed-direction content, a MAD price and missing-image state", () => {
    const html = renderToStaticMarkup(
      createElement(ListingCard, {
        labels,
        listing: baseListing,
        locale: "en",
      }),
    );

    expect(html).toContain('dir="auto"');
    expect(html).toContain("MAD");
    expect(html).toContain("65.00");
    expect(html).toContain("Food photo coming soon");
    expect(html).toContain("New cook");
  });

  it("renders an existing rating without inventing one for unrated cards", () => {
    const rated = renderToStaticMarkup(
      createElement(ListingCard, {
        labels,
        listing: { ...baseListing, rating: 4.7, reviewCount: 231 },
        locale: "fr",
      }),
    );
    expect(rated).toContain("4.7");
    expect(rated).toContain("(231)");
  });
});
