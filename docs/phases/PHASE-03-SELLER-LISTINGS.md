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
