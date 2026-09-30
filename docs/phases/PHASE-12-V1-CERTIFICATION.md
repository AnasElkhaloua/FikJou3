# Phase 12 — V1 Certification

Status: Formal sequential certification contract

## Objective and prerequisites

Audit the completed product exhaustively against the authoritative documentation and produce a durable certification report. Requires signed handoffs from Phases 00–11 and a production-like environment. This phase fixes defects within scope but adds no features.

## In scope

- Build a traceability matrix for every V1 requirement/phase criterion with evidence and classification: `PASS`, `PASS WITH DOCUMENTED LIMITATION`, `FAIL`, `OUT OF SCOPE`.
- Re-run clean quality gates, migration replay/upgrade, seed reproducibility and production-like provider/deployment smoke.
- Audit product boundaries, database integrity, auth/session/reset, authorization, public DTOs, contact/location privacy, messaging isolation, blocks, completion/reviews/aggregates, reports/suspensions/audit/admin, notifications, responsive/accessibility, SEO and failure states.
- Certify complete English and French coverage across public, authenticated, safety, admin, accessibility and SEO surfaces, including locale routing/detection/switching and untranslated user-authored content.
- Exercise required Playwright journeys on mobile/desktop and negative/adversarial paths.
- Record limitations, operational runbooks, provider/free-tier assumptions, rollback/recovery and final release decision.

## Out of scope

New features, scope changes disguised as polish, native apps, payments/orders/delivery, Arabic or locales beyond English/French, paid scaling architecture and certification by assertion without evidence.

## Database and routes/UI

No planned migration or route. A defect fix may add one only with owning-spec amendment and full replay/regression. Certification report location/format is chosen in-repository and links exact evidence without secrets.

## Security requirements

Test direct endpoint attacks as anonymous, wrong user, blocked/suspended user and non-admin; CSRF/open redirect/enumeration/rate-limit behavior; upload malicious files/metadata; public-coordinate/contact/DTO leakage; cache/log redaction; pending review secrecy; transaction rollback; secret/environment/dependency review. Do not run destructive probes against real user data.

## Tests and verification

From a clean checkout and empty database run the stable commands for lock/install verification, format, lint, strict typecheck, unit, PostgreSQL integration, Playwright, production build, migration replay/status, seed twice, accessibility checks, SEO crawl/schema validation and dependency audit. Then deploy/start with production-like configuration and smoke register→seller→listing→discover/map→favorite→message→complete→review→report/block→admin moderation in English and French, including cross-locale entity/path preservation.

## Acceptance criteria

- [ ] Every immutable in-scope feature and exclusion is audited (`00`, `01`).
- [ ] Schema constraints—including PostgreSQL rejection of zero/negative `priceAmount`—migrations, seeds, transactions and history rules pass (`03`, `10`).
- [ ] Auth, authorization, abuse controls and DTO privacy pass adversarial tests (`04`).
- [ ] Private location/contact/message/pending-review data is absent from public surfaces (`07`, `08`, `09`).
- [ ] Messaging isolation, mutual completion, blind reviews and aggregate rebuild are correct (`07`).
- [ ] Reports, blocks, suspensions, notifications, admin and audit are correct (`09`).
- [ ] Mobile/desktop accessibility, state UX, SEO and measured performance meet specs (`05`, `06`, `10`).
- [ ] All clean commands, production build and smoke test pass (`10`).
- [ ] English and French are complete across all V1 surfaces; missing/unreviewed French copy, locale-routing defects or localized duplication of user-authored content are in-scope `FAIL`s (`01`, `03`, `06`, `10`).
- [ ] Every limitation has impact, mitigation/operation and owner; no in-scope `FAIL` remains (`00`, `10`).

## Stop conditions and release rule

Any in-scope `FAIL`, incomplete English/French surface, flaky/unreproducible required gate, privacy/security leak, failed migration replay, non-reproducible seed, unauthorized access, or untested production-critical provider blocks V1. `PASS WITH DOCUMENTED LIMITATION` cannot be used for missing required French translation or broken locale behavior; otherwise it is acceptable only when behavior remains safe and in scope, limitation is visible/operationally managed, and no invariant is weakened. `OUT OF SCOPE` must cite an explicit exclusion.

## Handoff/report format

Produce: version/commit/environment; executive release decision; traceability matrix; command results; migration/seed evidence; English/French coverage and locale-behavior evidence; security/privacy audit; browser/accessibility/SEO/performance results; smoke evidence; provider assumptions; known limitations; operational/rollback notes; and unresolved failures. Declare “V1 complete” only if the release rule is satisfied.
