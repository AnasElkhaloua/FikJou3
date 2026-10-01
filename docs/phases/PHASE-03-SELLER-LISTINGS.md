# Phase 03 — Seller and Listings

Status: Sequential implementation contract

## Objective and prerequisites

Deliver seller onboarding/profile management, low-friction listing lifecycle, secure image pipeline, public listing detail and seller profile. Requires Phase 02 components and Phase 01 guards/schema.

## In scope

- Create/manage the single seller profile, public identity, city/area and initial contact preferences.
- Listing create/save draft/edit/publish/pause/reactivate/remove with server-derived ownership and legal transitions.
- 1–6 image upload, validation, transformation/EXIF removal, ordering/cover, opaque storage keys, deletion and failed-operation cleanup through storage adapter.
- Required/optional fields and decimal-safe price handling with `priceAmount > 0`; incomplete drafts use absence rather than a zero sentinel; category plus optional tags; pickup/delivery.
- Public `/[locale]/listing/[slug]`, `/[locale]/seller/[slug]`; locale-prefixed seller dashboard/list/edit routes.
- Complete EN/FR seller onboarding, management, validation, upload/lifecycle UI and locale-prefixed public listing/seller presentation. Authored seller/listing content remains one unchanged value across locales.
- Stable slug collision strategy and removed/private visibility behavior.

## Out of scope

Explore search/filter, maps/location picker precision (use area/public centroid-compatible groundwork), favorites, messaging/contact reveal, reputation reviews, reports, notifications and full admin.

## Database and routes/UI

Migrate listings, listing images and listing tags plus constraints/indexes; do not add localized title/description/profile columns. Add locale-prefixed sell/list/edit/listing/seller routes beneath both `/en` and `/fr`. Public pages return allow-listed DTOs, requested-locale platform labels and active authored content only.

## Security requirements

Every mutation loads listing→seller→session ownership; no client owner/status/publishedAt authority. Upload validates bytes/signature, MIME, size, dimensions, count and allowed raster formats; rejects SVG/arbitrary filenames; strips GPS EXIF; keys are random; provider credentials server-only. Publish transaction verifies seller/category/location/image/fulfillment. Rate-limit creation/upload/publish.

## Tests and verification

Run standard gates, migration replay, translation parity and provider contract tests. Cover one-seller uniqueness; cross-user reads/mutations; every lifecycle transition; incomplete publish; decimal scale and positive-price boundaries; explicit application and PostgreSQL rejection of `0.00` and negative prices; image count/order/concurrency; malicious files/names/EXIF; cleanup after provider/DB failure; public DTO/status exclusion; slug collision/stability. Playwright runs seller/listing management in EN and FR and proves switching preserves the same slug/entity and authored title/description/bio unchanged at mobile/desktop.

## Acceptance criteria

- [ ] User creates at most one seller profile and can still buy normally (`01`, `03`).
- [ ] Listing flow contains no inventory/order/restaurant fields (`00`, `01`).
- [ ] Application validation and PostgreSQL enforce decimal-safe `priceAmount > 0`; zero is never used for free, negotiable, price on request, missing, or draft sentinel (`00`, `01`, `03`, `10`).
- [ ] Ownership is server-derived and cross-user attempts fail (`04`).
- [ ] Image pipeline meets validation, privacy, order and cleanup requirements (`01`, `04`, `09`).
- [ ] Public listing/seller pages expose no private contact/coordinates/auth fields (`04`, `09`).
- [ ] Lifecycle and slugs match master decisions (`00`, `03`).
- [ ] Seller/listing UI, validation, accessibility labels and metadata are complete in EN and FR while authored content and entity identity remain single and unchanged (`00`, `01`, `02`, `06`).
- [ ] Required routes have accessible loading/error/empty/success states (`05`, `06`).
- [ ] Gates, migrations and end-to-end journeys pass (`10`).

## Stop conditions

Stop for unsafe uploads, orphan accumulation without reconciliation, ownership gaps, public private-field leakage, irreversible destructive cascade, or temptation to add orders/inventory.

## Handoff

Report migrations, routes, storage adapter/provider and limits, lifecycle/slug decisions, DTO field lists, cleanup evidence, security/test commands and known limitations for search/map phases.

## Implementation record

Status: Certified complete on 2026-10-01

### Database and domain decisions

- Generated migration `drizzle/0001_plain_maggott.sql` adds the `listing_status` enum plus `listings`, `listing_images`, `listing_tags`, and `storage_cleanup_jobs`. It was generated through Drizzle and retained without hand editing.
- Listing money is PostgreSQL `numeric(12,2)` and a decimal string in TypeScript. Application parsing performs no floating-point arithmetic. PostgreSQL rejects zero and negative values; an incomplete draft represents an absent price as `NULL`.
- PostgreSQL owns seller/category/city/area foreign keys, city-area consistency, MAD currency, slug uniqueness, fulfillment and active publish-field checks, image dimensions/size/WebP/order checks, listing-tag uniqueness, and the indexes used by owned and public reads. Seller/category/location deletion is restrictive; draft-dependent image/tag rows cascade only when a listing is deliberately deleted.
- Legal lifecycle transitions are `DRAFT -> ACTIVE`, `ACTIVE -> PAUSED`, `PAUSED -> ACTIVE`, and any non-removed state to terminal `REMOVED`. `publishedAt` is server-derived and retained on reactivation.
- Seller and listing slugs use a Unicode-preserving normalized base plus an eight-character UUID suffix. Slugs are immutable after creation and safely percent-encoded at URL/header boundaries.
- Authored display names, biographies, titles, and descriptions are stored once and rendered as plain React text with `dir="auto"`; there are no listing translation columns or tables.

### Authorization, privacy, and visibility

- Every seller/listing mutation accepts a server-loaded `Principal`, requires an active verified account, resolves ownership from the database, and ignores client identity/status/publish authority. Cross-user owned reads return no record and cross-user mutations fail authorization.
- Public listing projections allow only listing display fields, localized category/location labels, public seller display fields, and image delivery URLs/order. Public seller projections allow only display identity, coarse location, membership date, biography, and active listing card fields. Neither projection exposes email, phone/contact preferences, auth/user IDs, private coordinates, storage keys, or moderation internals.
- Public listing and local-media eligibility require an active listing, seller, user, category, city, and area. Seller pages additionally require an active seller/user/city and an active selected area. Draft, paused, removed, and ineligible-geography listings are not public.
- Published location is an area-centroid snapshot (`area-centroid-v1`), never a home/pickup coordinate. Exact location selection remains Phase 05 work.
- Database-backed limits are 5 seller creations per 15 minutes, 20 listing creations per hour, 30 image-upload actions per hour, and 30 publish/reactivation actions per hour.

### Images and storage

- The provider-neutral `ImageStorage` contract has local-development and Cloudinary implementations. Domain code does not import provider APIs. Production runtime forbids local storage and requires complete server-only Cloudinary configuration; production build analysis does not require live provider credentials.
- Uploads accept decoded JPEG, PNG, or WebP only; declared MIME must match decoded format. Input is limited to 5 MB, 320–6000 pixels per edge, 24 megapixels, and six images. Sharp auto-orients, bounds output to 2048 pixels, re-encodes WebP at quality 82, and emits no source metadata/EXIF.
- Random UUID storage keys discard original filenames and the local adapter validates every key before resolving a path. The first ordered image is the cover; database uniqueness and range checks protect positions 0–5.
- Partial provider failures delete already-stored objects. Transaction or image-metadata persistence failures compensate all newly uploaded objects. Removed image keys are deleted after commit. Failed deletes create durable `storage_cleanup_jobs` rows for later reconciliation rather than silently orphaning objects.
- Local `/api/media/[key]` delivery requires either full public eligibility or an active verified owner session. Private responses are `no-store`; eligible public responses may be cached and always use `nosniff` plus `image/webp`.

### Routes, localization, SEO, and UI

- Added locale-prefixed seller onboarding/dashboard, listing create/edit, public listing, and public seller routes. The dashboard manages profile details, contact preferences, drafts and legal lifecycle actions; terminal removal requires confirmation.
- EN/FR cover every Phase 03 platform string. Locale switching preserves the same entity slug and unchanged authored content. Management/create/edit surfaces are `noindex`.
- Eligible listing and seller pages produce localized titles/descriptions, canonical URLs, reciprocal EN/FR alternates, and English `x-default`. Metadata uses public fields only and does not invent ratings, reviews, availability, or popularity.
- Phase 02 `ListingCard`/`ListingGrid` remain the single card contract. Home's populated preview remains a development-only, Home-only fixture guarded from production; it is never seeded and real services do not depend on it. Explore/search remains intentionally unimplemented until Phase 04.

### Verification and security review

- Unit coverage includes decimal boundaries/formatting, lifecycle legality, Unicode/collision slugs, decoded-format and metadata-safe image processing, path-safe local storage, Cloudinary contract/failure behavior, and production storage policy.
- Real PostgreSQL coverage includes seller uniqueness/ownership, draft-null and positive-price boundaries, database constraints/indexes, Unicode persistence, public DTO allow lists, lifecycle/visibility, inactive geography, cross-user mutations, image ordering, provider compensation, transaction compensation, and durable cleanup jobs.
- Migration replay uses two empty real PostgreSQL databases. Phase 01 seed regression remains deterministic/idempotent and creates no marketplace seller/listing data.
- Playwright creates verified users through Better Auth, then exercises real seller onboarding, validation, upload/publish redirect, public listing/seller pages, EN/FR identity preservation, edit at 320 px, lifecycle at 390 px, cross-user edit rejection, removal, metadata, image delivery, and accessibility. Test uploads and PostgreSQL are disposable and cleaned after the run.
- Security review covered session-derived identity, ownership, account eligibility, public DTO allow lists, private/contact/coordinate leakage, Unicode/XSS-safe rendering, parameterized Drizzle queries, file signature/MIME/dimension/count validation, opaque/path-safe keys, EXIF removal, cleanup failure recovery, public media eligibility, rate limits, and server-only provider credentials.
- Final certification passed dependency/lockfile validation, formatting, zero-warning ESLint, strict TypeScript, 196-key EN/FR parity, 36 unit tests, 20 real-PostgreSQL integration tests, two-database migration replay, deterministic seed rerun, 13 populated-browser tests plus the isolated empty-mode browser test, production build, and the project's critical-severity audit policy. The audit reports four accepted moderate development-tool advisories inherited through Drizzle Kit; its suggested force-fix is a breaking downgrade and was not applied.

### Known boundaries and local startup

- Cloudinary is implemented behind the adapter and contract-tested without contacting a live provider; a deployment must supply and operationally verify its own Cloudinary account. Cleanup processing is durably queued, while a scheduled retry worker belongs to a later operational phase.
- Public coordinates are deliberately coarse area centroids. Discovery, search, maps, favorites, messaging, reviews, notifications, and admin are not part of Phase 03.
- For a fresh persistent local environment: copy `.env.example` to `.env.local`; set a reachable PostgreSQL `DATABASE_URL`, a 32+ character `BETTER_AUTH_SECRET`, `APP_URL=http://localhost:3000`, development email delivery, `STORAGE_DRIVER=local`, and a workspace-local `LOCAL_UPLOAD_DIR`; start PostgreSQL; run `npm install`, `npm run db:migrate`, and `npm run db:seed`; then run `npm run dev`. The reference seed is safe to rerun. Do not copy example secrets into production.
