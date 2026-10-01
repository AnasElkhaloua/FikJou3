export default function ExploreLoading() {
  return (
    <main aria-hidden="true" className="loading-main page-container">
      <span className="skeleton skeleton-title" />
      <span className="skeleton skeleton-search" />
      <div className="listing-grid" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <div className="listing-card" key={index}>
            <span className="skeleton skeleton-image" />
            <div className="listing-body skeleton-body">
              <span className="skeleton skeleton-line skeleton-line-wide" />
              <span className="skeleton skeleton-line" />
              <span className="skeleton skeleton-line skeleton-line-short" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
