import "server-only";

import type { ListingCardView } from "@/components/marketplace/listing-card-types";
import { serverEnv } from "@/env/server";

import { canLoadMarketplacePreview } from "./preview-policy";

export async function loadMarketplacePreview(): Promise<
  readonly ListingCardView[]
> {
  if (
    !canLoadMarketplacePreview(
      serverEnv.NODE_ENV,
      serverEnv.FIK_MARKETPLACE_PREVIEW,
    )
  ) {
    return [];
  }

  const { marketplacePreviewListings } =
    await import("./fixtures/marketplace-preview");
  return marketplacePreviewListings;
}
