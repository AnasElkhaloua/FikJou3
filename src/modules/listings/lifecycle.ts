export type ListingStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "REMOVED";
export type ListingTransition = "publish" | "pause" | "reactivate" | "remove";

const transitions: Record<
  ListingStatus,
  Partial<Record<ListingTransition, ListingStatus>>
> = {
  ACTIVE: { pause: "PAUSED", remove: "REMOVED" },
  DRAFT: { publish: "ACTIVE", remove: "REMOVED" },
  PAUSED: { reactivate: "ACTIVE", remove: "REMOVED" },
  REMOVED: {},
};

export function nextListingStatus(
  current: ListingStatus,
  transition: ListingTransition,
): ListingStatus | null {
  return transitions[current][transition] ?? null;
}
