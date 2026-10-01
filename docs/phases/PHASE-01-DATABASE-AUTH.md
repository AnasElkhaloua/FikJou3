# Phase 01 — Database and Authentication

Status: Complete — 2026-09-30

## Objective and prerequisites

Establish PostgreSQL/Drizzle foundations, Better Auth, core identities, seller/location/category foundation, authorization helpers and deterministic reference seeds. Requires Phase 00 handoff and working quality/database harnesses.

## In scope

- Configure Drizzle and controlled migration workflow against PostgreSQL.
- Implement Better Auth email/password, verification, reset, session and sign-out using a replaceable email adapter.
- Create/extend users, seller-profile foundation, countries/cities/areas, categories/tags and roles/statuses specified in `03`.
- Create normalized EN/FR translation tables for categories and platform-controlled country/city/area labels, plus optional user `preferredLocale`; do not localize user-authored entities.
- Seed Morocco, representative city/area data and candidate categories with complete EN/FR labels idempotently; no privileged demo security bypass.
- Implement session principal, verified-user, owner and admin guard primitives with safe error categories.
- Pin and configure a stable Next.js 16-compatible `next-intl`; establish typed `en | fr`, repository-owned key-parity-validated resources, top-level `[locale]` routing, root negotiation, safe preference cookie, locale-aware navigation helpers and formatting primitives.
- Implement complete EN/FR register/login/verification/reset interfaces and localized validation/user errors. English is fallback, but missing French keys fail development/tests.
- Add signup/login/verification/reset rate limits and enumeration-safe behavior; document exact values, trusted IP mechanism and CSRF/session choices.
- Create purpose-specific base public/private DTO projections and server-only database boundary.

## Out of scope

Seller onboarding UI, listings/images, discovery, messages, reviews, feature admin UI, phone OTP, phone uniqueness enforcement and production data policy automation.

## Database and routes/UI

Expected migrations: auth-provider tables, marketplace user status/role/phone-ready/preferred-locale fields, seller profiles, country/city/area, category/tag identities and normalized translation tables with all Phase 01-applicable constraints/indexes. Auth routes/pages live below both `/en` and `/fr` and may include register, login, verify-email request/result, forgot/reset password, and sign-out/session handling; styling uses existing shell only. Root `/` negotiates once to a supported locale.

## Security requirements

Provider-recommended password hashing/tokens; secure cookie flags; single-use expiry; locale-aware allow-listed relative redirects; session invalidation on reset; verified-email gates; uniform reset/login responses in both locales; server-side role/owner checks; redacted logs. Locale imports accept only `en | fr`, preference cookie cannot affect authorization, and switching preserves only safe internal destinations. Phone verification stays false/null. Admin permissions cannot be client-assigned.

## Tests and verification

Run format/lint/type/unit/integration/Playwright/build plus migration replay and seed-twice checks. Integration tests cover uniqueness/FKs/checks, translation `(entity,locale)` uniqueness/completeness, cross-city areas, one seller/user, auth statuses, admin guard, invalid sessions and transactional EN/FR seed. Browser tests cover EN and FR register/verify/login/logout/reset, root/browser/cookie negotiation, unsupported locale, deep switch preservation and malicious return URL. Resource validation proves exact key parity and fatal missing French keys.

## Acceptance criteria

- [x] Empty database migrates to head deterministically; previous migration state upgrades (`03`, `10`).
- [x] Seed reruns without duplicates and uses stable natural keys (`03`).
- [x] Better Auth flows and secure session/reset policies work (`04`).
- [x] Email verification gates protected marketplace capabilities; phone is never falsely verified (`04`).
- [x] Seller/user/location/category constraints and indexes match `03`.
- [x] Server guards reject unauthenticated, wrong-owner, suspended and non-admin calls (`04`).
- [x] Public DTO samples omit email, phone, auth/session and private fields (`04`, `09`).
- [x] Rate-limit values/backend/failure mode and CSRF strategy are documented/tested (`04`).
- [x] `/en` and `/fr` routing, deterministic fallback/persistence, safe switching and complete auth translations work; unsupported locales cannot load arbitrary resources (`00`, `02`, `04`, `06`).
- [x] Active category/location seed rows have one EN and one FR label with locale-neutral identity; user-authored entities have no locale duplicates (`01`, `03`).
- [x] All quality commands and production build pass (`10`).

## Stop conditions

Stop for unresolved Better Auth/schema incompatibility, inability to secure cookies/origins, non-replayable migrations, non-idempotent seed, absent production-capable rate limiter plan, or authorization only enforced in UI.

## Handoff

Report migration IDs/schema diagram, Better Auth and `next-intl` versions/configuration choices (no secrets), locale/resource structure and parity result, seed keys/EN-FR counts, route/negotiation/switch behavior, guard/DTO APIs, exact rate limits, command/test evidence, limitations and prerequisites for Phase 02.

## Implementation record

### Versions and persistence

- Better Auth `1.7.6`, `@better-auth/drizzle-adapter` `1.7.6`, Drizzle ORM `0.45.3`, Drizzle Kit `0.31.11`, PostgreSQL driver `pg` `8.23.0`, `next-intl` `4.14.8`, and `tsx` `4.23.15` are exact direct pins.
- Migration `drizzle/0000_magical_cerebro.sql` is the immutable Phase 01 baseline. Drizzle Kit generates committed SQL/snapshots; the application never migrates automatically at runtime. `db:migrate` applies committed migrations explicitly. Production rollback uses reviewed forward-fix migrations; destructive database recreation is limited to empty local/test databases.
- Application and Better Auth identifiers use PostgreSQL `uuid` columns. Better Auth is configured with `advanced.database.generateId = "uuid"`; database defaults use PostgreSQL `gen_random_uuid()` while deterministic seed identities use fixed documented UUIDs.
- The initial physical schema has 16 tables: `users`, `sessions`, `accounts`, `verifications`, `rate_limits`, `seller_profiles`, `countries`, `country_translations`, `cities`, `city_translations`, `areas`, `area_translations`, `categories`, `category_translations`, `tags`, and `tag_translations`. No Phase 02+ marketplace tables were created.

### Authentication and security

- Better Auth owns credential accounts, `scrypt` password handling, verification/reset records, session cookies and the `/api/auth/[...all]` handler. Email verification is required before login; verification and reset expire after one hour; reset revokes existing sessions; automatic sign-in after verification is disabled.
- User `status`, `role`, `phoneNumber`, and `phoneVerifiedAt` are server-owned Better Auth additional fields. Phone fields cannot be supplied through auth input and phone verification remains null. Optional `preferredLocale` accepts only the database `app_locale` enum (`en | fr`).
- Sessions expire after seven days and refresh at most daily. Cookies use the `fikjou3` prefix, provider defaults for `HttpOnly`/`SameSite`, and forced `Secure` in production. Better Auth origin and Fetch Metadata CSRF checks remain enabled; only the configured `APP_URL` is trusted. Redirects are additionally restricted to parsed relative paths inside the active locale.
- Auth rate limiting is enabled in every environment and persisted in PostgreSQL; no in-memory production fallback exists. Limits are: signup 5/15 minutes, login 10/15 minutes, verification resend 3/15 minutes, reset request 5/15 minutes, reset consume 5/15 minutes, and a 60/minute default. IPv6 keys collapse at `/64`. `AUTH_TRUSTED_IP_HEADER` is explicit, but deployment proxy trust must be revalidated in Phase 11/12 before production.
- `requireAuthenticated`, `requireActive`, `requireVerified`, `requireOwner`, and `requireAdmin` are reusable policy guards with stable safe error categories. Session principals are loaded server-side. Public/private user projections select allow-listed columns at query time.

### Email delivery

- Verification/reset delivery uses a provider-neutral `EmailSender` boundary. Development mode writes restrictive JSON files containing the delivery payload to ignored `.tmp/email-outbox`; it never logs links or tokens. Production runtime rejects development delivery, and `EMAIL_DELIVERY_MODE=provider` deliberately fails until a real adapter is selected. This is a documented deployment prerequisite, not a paid-provider coupling.

### Internationalization

- `next-intl` owns top-level always-prefixed `/en` and `/fr` routing, root/cookie/browser negotiation, safe unsupported-locale handling, repository message resources, server/client translation access and navigation helpers. `FIK_LOCALE` is a same-site, root-scoped preference cookie and is never an authorization input.
- English and French auth/shell resources have exact leaf-key parity enforced by `i18n:check`; missing/extra keys fail the gate. `Intl` helpers use `en-MA`/`fr-MA`, `Africa/Casablanca`, and MAD without changing stored values. Arabic is not selectable; logical CSS and the Unicode/RTL smoke fixture remain.

### Deterministic reference data

- Stable UUID upserts seed Morocco (`MA`, `MAD`), 6 cities, 12 areas and 9 categories. Active rows have exactly two translation rows: 2 country, 12 city, 24 area and 18 category translations. Category French labels use normal marketplace wording. Tag identity/translation tables exist as required foundations, but no speculative controlled tags are seeded before listing requirements need them.
- Seed executes in one transaction, is safe to rerun, and the quality gate runs it twice against real disposable PostgreSQL before asserting exact counts and EN/FR completeness.

### Verification evidence and limitations

- Unit tests cover locale contract, formatting foundations, safe redirects, authorization error branches and design/RTL foundations. PostgreSQL integration covers migration/schema behavior, seed replay, locale rejection, Unicode, seller uniqueness, location integrity, history-preserving delete restrictions, Better Auth verification/login/session/reset/token reuse, session revocation, suspension policy, DTO exposure, CSRF, enumeration-safe reset and persisted throttling.
- Final verification on 2026-09-30 ran the complete `npm run quality` pipeline successfully: dependency/lockfile dry-run, formatting, zero-warning ESLint, strict TypeScript, 41-key EN/FR parity, 18 unit tests, 7 real-PostgreSQL integration tests, focused migration replay, focused deterministic seed rerun, 4 Chromium Playwright tests, production build and critical-level dependency audit. The migration replay applied the committed migration independently to two newly created empty databases and asserted all 16 public tables on each.
- On Windows, migration replay and seed-rerun gates execute as focused Vitest suites using the same proven `pg-embedded` lifecycle as integration tests. Each suite owns its disposable PostgreSQL instance, closes every `pg` pool before `postgres.stop()` and `postgres.cleanup()`, and integration files run serially. This replaced a standalone CLI wrapper that completed its assertions but could leave npm waiting on the child-process lifecycle; it does not replace PostgreSQL with mocks, omit migration application, or weaken seed/idempotency assertions. The final quality process returned normally, and no disposable random-port PostgreSQL process remained afterward.
- Playwright covers root negotiation, EN/FR auth rendering, deep language switching/query preservation, unsupported locales and 320px French registration. The production build emits only locale-prefixed UI routes plus the Better Auth handler.
- `npm audit` reports four moderate development-only findings inherited by the current stable Drizzle Kit through deprecated `@esbuild-kit`/old `esbuild`. The advisory affects an exposed esbuild development server; this project uses Drizzle Kit only as a local migration generator and exposes no such server. No high or critical vulnerability exists. Downgrading to npm's suggested Drizzle Kit `0.18.1` would break the selected compatible toolchain; re-evaluate when a stable fixed Drizzle Kit release is available.
- Phase 02 must select no email vendor. A production email provider adapter and verified production proxy/header configuration remain later deployment prerequisites. No seller onboarding, marketplace public shell, listing, discovery or other Phase 02+ behavior was started.

### Post-Phase-04 deployment-readiness amendment — 2026-10-01

- The documented production-email prerequisite is now satisfied by an official Resend SDK adapter behind the existing provider-neutral `EmailSender` contract. `EMAIL_DELIVERY_MODE=development` continues to write verification/reset payloads only to the ignored development outbox; production runtime requires `EMAIL_DELIVERY_MODE=provider`, `RESEND_API_KEY`, and configurable `EMAIL_FROM` values.
- Verification and password-reset messages retain their original Better Auth origin, one-hour token lifetimes, single-use/reset-session behavior, and enumeration-safe request behavior. Both messages now provide simple branded EN/FR plain-text and HTML bodies. Provider errors are converted to a stable generic delivery error without logging provider responses, credentials, tokens, or full secret URLs.
- The complete project quality pipeline passed after this amendment: 51 unit tests, 28 real PostgreSQL integration tests, empty-database migration replay, deterministic seed rerun, 21 Chromium Playwright tests, production build, and the critical-threshold dependency audit. The four pre-existing moderate Drizzle Kit development-chain advisories remain documented; Resend introduced no additional audit finding.
