# Phase 01 — Database and Authentication

Status: Sequential implementation contract

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

- [ ] Empty database migrates to head deterministically; previous migration state upgrades (`03`, `10`).
- [ ] Seed reruns without duplicates and uses stable natural keys (`03`).
- [ ] Better Auth flows and secure session/reset policies work (`04`).
- [ ] Email verification gates protected marketplace capabilities; phone is never falsely verified (`04`).
- [ ] Seller/user/location/category constraints and indexes match `03`.
- [ ] Server guards reject unauthenticated, wrong-owner, suspended and non-admin calls (`04`).
- [ ] Public DTO samples omit email, phone, auth/session and private fields (`04`, `09`).
- [ ] Rate-limit values/backend/failure mode and CSRF strategy are documented/tested (`04`).
- [ ] `/en` and `/fr` routing, deterministic fallback/persistence, safe switching and complete auth translations work; unsupported locales cannot load arbitrary resources (`00`, `02`, `04`, `06`).
- [ ] Active category/location seed rows have one EN and one FR label with locale-neutral identity; user-authored entities have no locale duplicates (`01`, `03`).
- [ ] All quality commands and production build pass (`10`).

## Stop conditions

Stop for unresolved Better Auth/schema incompatibility, inability to secure cookies/origins, non-replayable migrations, non-idempotent seed, absent production-capable rate limiter plan, or authorization only enforced in UI.

## Handoff

Report migration IDs/schema diagram, Better Auth and `next-intl` versions/configuration choices (no secrets), locale/resource structure and parity result, seed keys/EN-FR counts, route/negotiation/switch behavior, guard/DTO APIs, exact rate limits, command/test evidence, limitations and prerequisites for Phase 02.
