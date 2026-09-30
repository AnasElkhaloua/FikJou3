# Fik Jou3? — Testing and Quality

Status: Authoritative V1 quality contract

## Test strategy

Testing is mandatory feature work. Use a pyramid:

- **Unit/domain (Vitest):** pure validation, money formatting/calculation boundaries, state transitions, generalization, permission policies, review timing/publication, aggregate logic and DTO mapping.
- **PostgreSQL integration:** migrations/schema constraints, repositories/queries, transactions, concurrency, ownership/isolation, search, provider-boundary cleanup records, seed behavior. Use real PostgreSQL, not SQLite mocks for database guarantees.
- **Component/accessibility integration where useful:** forms, keyboard/focus, state rendering and responsive component behavior.
- **Playwright:** high-value user journeys against production-like app/database/providers or deterministic fakes at provider boundaries.

Tests must be deterministic, isolated and parallel-safe. Control clock/UUID/provider outcomes through explicit test seams. Never weaken production constraints or add privileged product bypasses for tests.

## Required domain coverage

- Listing validation, decimal-safe money, strict `priceAmount > 0` application validation and PostgreSQL constraint behavior—including rejection of zero/negative values—lifecycle transitions, ownership, image count/order/cleanup and publish dependencies.
- Auth/session gates, verified-email policy, role/status handling, open-redirect/CSRF behavior chosen in Phase 01.
- Seller uniqueness, category/location relationships, favorites and blocks uniqueness.
- Discovery search/filter/sort/pagination and status exclusion.
- Public/private location generalization and forbidden-field response snapshots.
- Conversation uniqueness under concurrency, member isolation, unread state, message ordering and block-aware sends.
- Mutual completion, withdrawal before completion, review eligibility/deadline, blind publication concurrency and contextual aggregates.
- Reports, suspensions, moderation audit and notification transactionality.
- Admin authorization including direct endpoint calls by non-admins.
- EN and FR route rendering, resource key parity, locale negotiation/fallback, switcher path/query preservation, unsupported locale safety, and authenticated preference behavior.
- Locale-aware dates/numbers/MAD prices, localized taxonomy/location labels and metadata/canonical/hreflang/sitemap alternates.
- User-generated listing/seller/message/review text remains byte-for-byte semantically unchanged when switching locale; no localized duplicate marketplace entities exist.

Every authorization feature includes unauthenticated, wrong authenticated user, suspended user, invalid state, and valid owner/member/admin cases. Every privacy DTO test asserts an allow-list and explicitly rejects email, phone, private coordinate, token, report and pending-review fields.

## Required Playwright certification journeys

Run the critical journey in both EN and FR where user-facing UI is involved: register/verify/login/logout/reset (with deterministic email adapter); create seller; create/edit/pause/reactivate listing; upload/reorder/remove images; browse/search/filter/sort; favorite/unfavorite; map/list interaction without coordinate leakage; start/reuse conversation; reply/read state; block and prove send disabled; mutually complete; submit both review orders and lone expiry scenario; report supported content; and execute representative admin moderation/restoration. Test language switching at deep public/private routes, mobile and desktop layouts, and unchanged authored content.

## Quality gates

Phase 00 establishes stable commands for install-lock verification, formatting check, lint, strict typecheck, unit tests, integration tests, Playwright, production build, migration status/replay and seed verification. A phase handoff runs all directly affected gates plus the standard fast suite. Phase 12 runs all gates from a clean checkout/database.

Required outcomes:

- No ignored TypeScript errors, unreviewed suppressions or lint errors.
- Formatting check is clean and reproducible.
- Production build succeeds with validated environment separation.
- Tests have no accidental `.only`, blanket skips, network dependence, order dependence or unexplained flakes.
- Migrations replay from empty to head and upgrade the previous phase state; rollback strategy is documented even if forward-fix is chosen.
- Seed runs twice with identical reference data and no duplicate demo identities.
- Dependency audit has no unresolved exploitable critical issue; exceptions are documented by impact and mitigation.
- EN/FR resource validation has no missing keys or unreviewed English fallback in French; generated/test-only missing-key behavior is visibly fatal.

Coverage percentages may be diagnostic but do not replace invariant/branch coverage. Security-critical branches require explicit tests.

## Accessibility, responsive and performance expectations

Automated accessibility checks cover representative public, form, messaging and admin pages, supplemented by keyboard/focus/manual screen-reader-oriented inspection. No critical/serious automated violation remains. Verify zoom/reflow, error labels, modal focus, target size and list alternative to maps.

Test critical flows at representative small mobile, tablet and desktop viewports; no horizontal overflow or unreachable action. Image dimensions/loading avoid layout shift. Phase 11 records production-like performance budgets using measured baselines (including public page responsiveness, JS/image weight and key web vitals) rather than inventing unsupported numbers earlier. Regressions require explanation or fix.

## CI and test data

CI provisions a clean PostgreSQL service, validates migrations, seeds reference data, and runs gates with least-privilege test credentials. Tests create unique owned fixtures and clean via transaction/schema/database isolation. Secrets never appear in fixtures, snapshots or logs. Provider adapters use contract tests and deterministic fakes; at least one deployment smoke test verifies real configured integrations without destructive actions.

## Traceability and certification

Each phase acceptance criterion cites one or more numbered specs and names evidence: test file/suite, command result, manual check, migration, screenshot/report or decision record. Phase handoffs list passed criteria, changed schema/routes, security/privacy evidence, remaining limitations, and exact next prerequisites.

Phase 12 produces a certification matrix with `PASS`, `PASS WITH DOCUMENTED LIMITATION`, `FAIL`, or `OUT OF SCOPE`. It covers product scope, complete EN/FR interface and localized SEO, database integrity, authentication, authorization, privacy/location privacy, messaging isolation, review integrity, moderation, responsive behavior, accessibility basics, build/lint/format, all test layers, migration replay, seed reproducibility and production-like smoke. Incomplete French coverage is an in-scope `FAIL`; no in-scope `FAIL` permits a V1-complete declaration.
