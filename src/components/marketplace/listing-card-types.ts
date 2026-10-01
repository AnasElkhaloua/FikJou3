export type FulfillmentMode = "pickup" | "delivery";

export type ListingCardImage = Readonly<{
  alt: string;
  position: "start" | "center" | "end";
  src: string;
}>;

export type ListingCardView = Readonly<{
  categorySlug: string;
  fulfillment: readonly FulfillmentMode[];
  href?: string;
  id: string;
  image: ListingCardImage | null;
  location: string;
  priceAmount: string;
  rating: number | null;
  reviewCount: number;
  sellerName: string;
  title: string;
}>;
