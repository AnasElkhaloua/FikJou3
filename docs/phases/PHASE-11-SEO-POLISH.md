# Phase 11 — SEO and Polish

Status: Sequential implementation contract

## Objective and prerequisites

Complete metadata/indexing strategy, accessibility, responsive/performance/error polish and production deployment readiness without expanding product scope. Requires all functional/admin phases complete.

## In scope

- Per-page title/description, canonical URLs and Open Graph for active public Home, Explore policy, listing, seller and meaningful category pages.
- Complete English and French metadata for every indexable public surface, with self-canonicals, reciprocal `hreflang` alternates for `en`/`fr`, and an `x-default` targeting the English URL.
- Locale-aware sitemap containing only canonical active public content and its English/French alternates; robots/noindex for auth/private/management/messages/settings/notifications/admin and noncanonical filters.
- Semantically valid structured data only after reviewing actual page meaning; no false product availability/review claims.
- Slug/redirect/404 and pagination/duplicate-filter URL policy.
- Full responsive, keyboard, focus, contrast, reduced-motion, error/loading/empty and mixed-script/RTL-readiness audit.
- Image/font/bundle/cache/query performance tuning from measured production-like baselines.
- Security headers/CSP, provider configuration, environment/deployment/migration/rollback/runbook and production-like smoke readiness.

## Out of scope

Spammy city/category pages, manufactured content/ratings, Arabic or locales beyond English/French, dark mode, recommendation/analytics product features, new V1 features and paid-only infrastructure requirements.

## Database and routes/UI

No schema change expected except a demonstrated SEO/performance requirement approved in specs. Add metadata/sitemap/robots/OG routes or framework conventions. Polish all existing routes; private content never becomes public for SEO.

## Security requirements

Metadata/structured data/public caches use safe DTOs and generalized location only. CSP/security headers must not weaken XSS/upload defenses. Canonical/redirect inputs are allow-listed; sitemaps exclude removed/suspended/private records. Production env validates secrets, trusted proxy/IP, cookie domain and rate limiter. Deployment migration is controlled and reversible/forward-fix documented.

## Tests and verification

Run complete gates. Crawl English and French public/private routes for localized metadata, self-canonical, reciprocal `hreflang`, `x-default`, sitemap/robots/noindex correctness; validate structured data; test deleted/renamed slugs and filter duplicates. Run automated accessibility plus manual keyboard/focus/reflow at representative viewports, including long French strings. Measure public page web vitals/bundle/image/query baselines and record budgets. Run production build and deployment-like smoke with provider failures.

## Acceptance criteria

- [ ] Metadata/canonical/OG/sitemap/robots match route visibility (`06`).
- [ ] Structured data is truthful and contains no private coordinates/contact/pending reviews (`04`, `08`, `09`).
- [ ] No spammy programmatic or duplicate filter indexing (`00`, `06`).
- [ ] Critical flows meet responsive/accessibility design requirements (`05`, `10`).
- [ ] Performance budgets are measured, documented and met or limited explicitly (`10`).
- [ ] Security headers/env/providers/deploy migration/rollback runbook are production-ready (`02`, `04`).
- [ ] Full clean build and test gates pass (`10`).
- [ ] English and French metadata, canonicals, alternates and sitemap relationships are complete and internally consistent (`01`, `06`, `10`).

## Stop conditions

Stop on SEO leakage of private/inactive content, false structured data, accessibility blocker, unexplained severe performance regression, unsafe CSP/redirect/cache, or deployment dependent on undocumented paid service.

## Handoff

Report indexed/non-indexed route matrix, sample metadata/schema validation, sitemap/robots results, accessibility/responsive audit, performance measures/budgets, security headers, deployment/runbook and every documented limitation for certification.
