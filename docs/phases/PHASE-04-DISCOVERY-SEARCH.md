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

## Implementation record

Status: Certified complete on 2026-10-01

### Discovery architecture and public eligibility

- `modules/discovery` owns untrusted query parsing/normalization, URL serialization, filter resolution, parameterized PostgreSQL construction, deterministic pagination, and the allow-listed card projection. Server pages pass only a `DiscoveryInput`; React components do not construct SQL or receive ORM rows.
- One `publicListingEligibilityConditions()` boundary now governs discovery, public listing detail, seller listing collections, and local-media eligibility. It requires an active listing, seller, owning account, category, country, city, and area. Discovery additionally requires the ordered cover image that active publication already guarantees.
- The public card DTO contains only `id`, locale-neutral category slug and listing href, authored title/seller name, localized coarse area label, decimal price string, safe cover delivery URL/alt, fulfillment flags, and truthful null-rating state. It never selects contact details, auth identifiers, private/public coordinate columns, storage keys, or moderation data.

### Search, filters, sorting, and pagination

- Migration `0002_absurd_xavin.sql` adds a stored generated `search_vector` and GIN index; `0003_slippery_red_skull.sql` adds the composite active/newest deterministic-order index. PostgreSQL `simple` configuration weights title `A` and description `B`; because it is generated, inserts and title/description updates refresh atomically without a job or stale window. Seller display name plus requested-locale category/tag labels are matched through public joins/`EXISTS` at read time so their updates are immediately visible too.
- Query input is Unicode NFKC-normalized, trimmed, and collapsed to single spaces without modifying stored authored text. Search is case-insensitive PostgreSQL lexeme matching through `websearch_to_tsquery`; punctuation is parsed safely and every value remains a bound parameter. Search is intentionally accent-sensitive, whole-lexeme, and does not claim fuzzy, typo-tolerant, stemming, or prefix completion behavior. Mixed English, French, Arabic, and Darija text is preserved and tested.
- The shareable grammar is `q`, `city`, `area`, `category`, `min`, `max`, `pickup=1`, `delivery=1`, `sort`, and `page`. City/area/category values are stable locale-neutral slugs; price is a positive decimal string with no JavaScript floating-point arithmetic. Invalid syntax, unknown sort/page values, empty form values, and unsupported keys canonicalize away; valid-looking unknown or cross-city slugs are ignored with localized feedback.
- Filters intersect. Area resolution requires the selected active city, and Morocco/active-country eligibility is explicit. Fulfillment means capability only and introduces no distance, fee, or ETA semantics.
- Implemented sorts are `newest` (default, `published_at DESC, id DESC`), `price-asc` (`price_amount ASC, id ASC`), and `price-desc` (`price_amount DESC, id ASC`). Rating sort is deliberately deferred until Phase 08 supplies real seller-context aggregates; the UI and query allow-list do not expose a fake or disabled option.
- Pagination is server-side, page-based, fixed at 12 results, capped at page 100, and reset to page 1 when filters change. Exact totals are calculated from the same eligibility/filter predicate; out-of-range pages normalize to the last available page. Page URLs preserve every safe filter and locale switching preserves the exact logical query.

### Routes, UI, localization, and indexing

- `/[locale]/explore` is the real PostgreSQL-backed discovery surface. `/[locale]/category/[slug]` validates an active database category, renders the same result system, and owns localized canonical/alternate metadata. Home category chips link to Explore using stable slugs.
- Home now shows a bounded eight-item newest real-public-listing query through the same DTO and `ListingCard`; Phase 02 preview fixtures remain isolated development assets but are no longer imported by a product route or test dataset.
- Desktop uses a compact form panel above food-first results. Mobile uses an accessible disclosure, two-column controls that collapse to one column at 360px, and a sticky apply/reset row above the fixed navigation. Active filters are individually removable chips with reset-all; empty marketplace and filtered-no-result states have distinct EN/FR copy.
- All Phase 04 strings, metadata, form names, status text, pagination, and accessibility names have EN/FR parity. Platform taxonomy/geography labels localize while listing/seller content and identity remain unchanged. The reused card truthfully shows “New cook” until Phase 08.
- Explore and arbitrary filter combinations are `noindex,follow` with a clean locale Explore canonical. Valid category pages are indexable with locale-specific canonicals plus EN/FR and English `x-default` alternates. Phase 11 retains broader sitemap/filter SEO policy.

### Performance, security, and verification decisions

- Existing B-tree indexes remain the evidence-based filter set: published time, category/status, city/area/status, price, and seller/status. Phase 04 adds the GIN search index plus `(status, published_at DESC, id DESC)` for the default bounded browse. Real PostgreSQL `EXPLAIN (ANALYZE, BUFFERS)` coverage verifies the active/newest, category/status, price, and GIN access paths; the tiny deterministic fixture uses forced no-sequential-scan during index-path assertions because its natural cheapest plan is correctly a sequential scan at that size.
- Search is public and receives no aggressive request counter. Abuse is bounded by the 80-character query limit, single-value filters, explicit sort allow-list, fixed page size, and page-depth cap. All dynamic values use Drizzle/SQL-template parameters; no client column or order expression is interpolated.
- Unit coverage verifies normalization, decimal/range rules, sort/page allow-lists, serialization, and page reset. Real PostgreSQL coverage verifies eligibility exclusions, English/French/Arabic/accented authored search, seller/category/tag search, every filter and combinations, cross-city rejection, decimal comparisons, all implemented sorts, page integrity, DTO privacy, hostile SQL-like input, localized controlled labels, indexes, and plans.
- Playwright uses isolated real PostgreSQL records and safe local WebP media. It covers EN/FR results, search, category/city/area/price/fulfillment filters, sorting, filter removal/reset, pagination, listing navigation, category routes/metadata, locale/query preservation, canonical invalid-input recovery, mobile filters at 320px, no overflow, empty state, accessibility, and settled visual screenshots at desktop/mobile sizes.

### Known limitations and Phase 05 contract

- `simple` full-text configuration intentionally offers no language-specific stemming, accent folding, prefix completion, or typo tolerance. Joined seller/category/tag matches are correct and immediately fresh but do not have a combined denormalized index; revisit only with measured production-scale evidence.
- Page-based pagination is stable for a fixed dataset. Like ordinary offset pagination, concurrent publication ahead of the current page can shift later pages; a cursor conversion is deferred until measured need because current URLs and SEO benefit from finite page numbers.
- Rating sort remains unavailable until Phase 08. Favorites remain Phase 06. No MapLibre code, bounds, markers, geospatial viewport state, or private-coordinate behavior was introduced. Phase 05 can consume the same validated discovery input and public eligibility boundary while adding a separate map-marker projection containing only generalized public coordinates.
- Local startup remains: copy `.env.example` to `.env.local`; provide reachable PostgreSQL and a 32+ byte Better Auth secret; use development email delivery plus `STORAGE_DRIVER=local` and a workspace-local `LOCAL_UPLOAD_DIR`; run `npm install`, `npm run db:migrate`, `npm run db:seed`, then `npm run dev`. No example credential is suitable for production.

### Final certification verification

- The complete `npm run quality` pipeline passed from start to finish on 2026-10-01 after the final browser-test stabilization: dependency/lockfile dry-run, Prettier, ESLint with zero warnings, strict TypeScript, 232-key EN/FR parity, 41 unit tests, 28 real PostgreSQL integration tests, empty-database migration replay, deterministic seed plus rerun/idempotency verification, 21 Chromium Playwright tests, and the Next.js production build.
- `npm audit --audit-level=critical` passed. The audit continues to report four moderate development-tool advisories in the Drizzle Kit transitive `@esbuild-kit`/`esbuild` chain; the offered forced remediation is a breaking downgrade and was not applied.
- Repository review found no package or lockfile changes, no credential material, no tracked generated runtime output, and no Phase 05 map implementation. `.next`, `.tmp`, `node_modules`, `test-results`, `next-env.d.ts`, and `tsconfig.tsbuildinfo` remain ignored local artifacts.
- Representative real PostgreSQL plans, the generated migration artifacts, the public DTO allow-list, deterministic result ordering, hostile-input behavior, responsive EN/FR flows, accessibility checks, and desktop/mobile visual states were reviewed as part of certification.
