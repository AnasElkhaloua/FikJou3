# Phase 04 — Discovery and Search

Status: Sequential implementation contract

## Objective and prerequisites

Deliver public Explore with PostgreSQL search, filters, sorting, categories/tags, stable pagination and listing grids. Requires real active listings from Phase 03. Favorites remain Phase 06.

## In scope

- `/explore` query parsing and shareable URL state.
- EN/FR Explore/category interface, route-preserving language switching and requested-locale taxonomy/location labels.
- PostgreSQL search across listing title/description, seller display name, category and tags where practical.
- City, area, category, min/max price, pickup and delivery filters.
- Newest, price low/high and seller-rating sorts with deterministic tie-breaks/unrated behavior.
- Stable pagination, result count only when accurate/cost-appropriate, clear filters, category pages with actual value.
- Search vector/index refresh strategy, query plans and public card DTO.
- Home listing sections only where backed by an explicit observable query; otherwise retain honest state.

## Out of scope

Map UI/bounds, precise/generalized location picker, favorites persistence, ML/personalization, promoted results, Elasticsearch and spammy SEO landing pages.

## Database and routes/UI

Add search generated column/materialized table/indexes only as chosen and migrated; add evidence-based indexes for filters/sorts. Implement locale-prefixed Explore and meaningful category pages; enhance each localized home. Category identity/slug is shared while display name is selected by locale. Invalid query state is normalized or returns safe localized validation feedback.

## Security requirements

Parameterize every query; validate lengths/enums/numbers/slugs and bound page size/complexity; exclude non-active listing/seller/category/location; public DTO omits contact/private coordinates. Search terms are not reflected unsafely or logged with sensitive context. Rate/control abusive expensive queries.

## Tests and verification

Run standard gates/migration replay/resource parity. Integration fixtures cover mixed English/French/Arabic/Darija authored text, locale-selected category/location/platform-tag labels, all filters/combinations, cross-city area rejection, status exclusion, tag updates, deterministic pages, rating ties/unrated, SQL-like input, query bounds and representative query-plan inspection. Playwright covers EN/FR search/filter/sort/clear/pagination, route/query-preserving switching, unchanged authored results and mobile filter drawer.

## Acceptance criteria

- [ ] Search and every declared filter/sort return correct active public listings (`01`, `08`).
- [ ] Exact search configuration, normalization and refresh strategy are documented (`02`, `08`).
- [ ] Pagination is stable with deterministic tie-breaks and bounded page size (`08`).
- [ ] Public card payload is an allow-list with no contact/private coordinates (`04`).
- [ ] Categories/tags are database data; tags remain optional (`01`, `03`).
- [ ] EN and FR discovery surfaces use localized controlled vocabulary and formatting; switching locale preserves filters, result identity and authored content (`00`, `01`, `03`, `08`, `10`).
- [ ] No recommendation, personalization, promotion or fake popularity claim exists (`00`, `01`).
- [ ] Representative queries use appropriate indexes with recorded plans (`03`, `08`).
- [ ] Responsive/accessibility states and all gates pass (`05`, `06`, `10`).

## Stop conditions

Stop for unbounded/unsafe query construction, stale search data without repair strategy, unstable pagination, private-field projection, or need for an excluded search service.

## Handoff

Report search schema/config, indexes and plans, query parameters/defaults, pagination/sort decisions, DTO, routes/states, test evidence, measured limitations and Phase 05 map integration contract.
