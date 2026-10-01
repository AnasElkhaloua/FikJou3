import { AlertCircle, CookingPot } from "lucide-react";

import { Link } from "@/i18n/navigation";

export function EmptyState({
  action,
  description,
  href,
  title,
}: {
  action: string;
  description: string;
  href: "/" | "/explore" | "/register";
  title: string;
}) {
  return (
    <section className="state-card" data-marketplace-state="empty">
      <CookingPot aria-hidden="true" size={28} strokeWidth={1.5} />
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="secondary-link" href={href}>
        {action}
      </Link>
    </section>
  );
}

export function ErrorState({
  action,
  description,
  onRetry,
  title,
}: {
  action: string;
  description: string;
  onRetry: () => void;
  title: string;
}) {
  return (
    <section className="state-card" role="alert">
      <AlertCircle aria-hidden="true" size={28} strokeWidth={1.5} />
      <h2>{title}</h2>
      <p>{description}</p>
      <button className="secondary-button" onClick={onRetry} type="button">
        {action}
      </button>
    </section>
  );
}

export function ListingGridSkeleton() {
  return (
    <div aria-hidden="true" className="listing-grid skeleton-grid">
      {Array.from({ length: 8 }, (_, index) => (
        <div className="listing-card" key={index}>
          <div className="skeleton skeleton-image" />
          <div className="listing-body skeleton-body">
            <span className="skeleton skeleton-line skeleton-line-wide" />
            <span className="skeleton skeleton-line" />
            <span className="skeleton skeleton-line skeleton-line-short" />
          </div>
        </div>
      ))}
    </div>
  );
}
