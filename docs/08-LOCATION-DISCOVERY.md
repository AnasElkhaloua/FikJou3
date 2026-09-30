# Fik Jou3? — Location and Discovery

Status: Authoritative V1 geographic and discovery contract

## Geographic model

Model `Country → City → Area`. V1 seeds Morocco (`MA`, `MAD`) plus representative cities/areas; records are database-managed and active/deactivatable. Stable geography identity/slugs are locale-neutral, while platform-controlled country/city/area display labels have complete EN and FR translation rows. City and area store public centroids. All selection and query logic validates that area belongs to city and city to country. Adding another country must require data/configuration, not schema redesign.

## Private/public separation

A seller/listing may accept a private approximate input pin to help identify an area, but public discovery must never expose a home coordinate. Persist private latitude/longitude only when a documented feature needs it and with restricted access. Persist separate public latitude/longitude plus generalization version.

The public point is derived from the selected area’s public centroid (city centroid fallback) plus a deterministic, bounded pseudorandom offset keyed by listing and a server secret/version. It is **not** produced by rounding, truncating or lightly jittering the private pin. Thus the public marker communicates area-level presence without preserving distance/direction to a home.

Phase 05 selects and documents radius bands appropriate to dense/less-dense Moroccan areas, validates points remain within a reasonable city/area display region, and supports regeneration by version without exposing the secret. A minimum privacy threshold must be tested; if an area is too small/sparse to generalize safely, use its centroid or cluster rather than precision. Multiple listings from one seller should avoid revealing a common private origin.

Only private listing-management services and narrowly authorized admin safety tooling may read private coordinates. Public card/detail/map/search DTOs select only city/area labels and public coordinates. Exact pickup/meeting details belong in private messaging/contact between parties.

## Discovery query contract

Default is a paginated grid of active listings whose seller, category and location are active. Search considers authored listing title/description and seller display name unchanged, plus the active locale's category/platform-tag labels using PostgreSQL. Phase 04 documents tokenization/accent/case behavior suitable for mixed English/French/Arabic/Darija, plus the refresh/index strategy. Locale switching never rewrites or substitutes authored content.

Filters: country (implicit Morocco initially), city, area, category, price minimum/maximum, pickup, delivery. Invalid combinations (area outside city, min above max) produce validation errors or normalized safe state. Sorts: newest (stable tie-breaker ID), price ascending/descending, and seller rating. Rating sort specifies unrated placement and stable tie breakers. No recommendation/personalization claims.

Locale-prefixed URL query state is canonical and shareable. Pagination must be stable under the selected sort; Phase 04 chooses cursor or page-based strategy and documents SEO/caching implications. Switching locale preserves safe filters/query where practical. Search/card DTOs contain only needed public fields, requested-locale platform labels, authored content unchanged, and no phone/email/private coordinates.

## Map behavior

Use MapLibre GL JS. Desktop may show synchronized result list and map split view. Mobile starts with list/grid and opens an explicit primarily full-screen map. Markers may show prices; selecting one highlights/reveals a corresponding listing preview, and selecting a card may focus its public marker. Clustering is allowed for clarity.

The query model supports `north`, `south`, `east`, `west` bounds with validation, coordinate normalization and maximum-area limits. “Search this area” is an explicit action so panning does not unexpectedly replace results. Grid and map represent the same filter set, though map may request a bounded marker projection optimized for display. Never send private points or contact data.

Map is enhancement, not the only navigation: an accessible list remains available. Show attribution required by tile/data providers. Handle tile/geocoder failure with a usable listing experience.

## Provider boundaries

MapLibre rendering must not hardcode a paid Google Maps dependency. Tile style and geocoding are configured adapters. Public OpenStreetMap tile/Nominatim infrastructure is not guaranteed unlimited production capacity; comply with provider usage/attribution policies and select a suitable free-tier/self-hostable option before deployment. Do not expose server provider secrets in browser bundles.

## Search and performance indexes

Use a PostgreSQL full-text/indexed strategy plus B-tree indexes for active/status, city/area/category, published time, price, fulfillment and seller lookup. Do not create one index per possible filter without query evidence. Inspect representative query plans/data volume in Phase 04/05. Map bounds may use PostGIS only if justified; V1 can use validated numeric bounding predicates and indexes without making PostGIS mandatory.

## Privacy threat scenarios and tests

- Public API/source/cache/sitemap/structured data accidentally contains private coordinates.
- Public point is mathematically close enough to reverse private pin or repeated markers triangulate a home.
- Image EXIF exposes GPS.
- Error/log/admin export leaks coordinates.
- Area IDs are accepted across the wrong city.
- Map endpoints bypass listing/seller status or contact DTO rules.
- Cache mixes authorized private management data with public pages.

Tests must use sentinel private coordinates and assert they never occur in any public serialized output, HTML, metadata, logs/fixtures or map payload. Verify generalization determinism/versioning, minimum separation/centroid strategy, coordinate range, cross-city rejection, status filtering and public/private query-column separation. Phase 12 repeats these tests against production-like routes.
