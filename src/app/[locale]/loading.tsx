import { ListingGridSkeleton } from "@/components/marketplace/states";

export default function Loading() {
  return (
    <main aria-hidden="true" className="loading-main page-container">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-search" />
      <ListingGridSkeleton />
    </main>
  );
}
