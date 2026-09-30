export type FulfillmentMode = "pickup" | "delivery";

export type PreviewImage = Readonly<{
  alt: string;
  position: "start" | "center" | "end";
  src: string;
}>;

export type ListingCardView = Readonly<{
  categorySlug: string;
  fulfillment: readonly FulfillmentMode[];
  id: string;
  image: PreviewImage | null;
  location: string;
  priceAmount: string;
  rating: number | null;
  reviewCount: number;
  sellerName: string;
  title: string;
}>;
