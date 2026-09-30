# Phase 09 — Moderation and Notifications

Status: Sequential implementation contract

## Objective and prerequisites

Finalize user-facing reports/blocks, in-app notifications, suspension effects, retention decisions and moderation domain logic for the later admin UI. Requires messaging/reviews entities.

## In scope

- Report creation for all target types/reasons, duplicate/spam prevention and status model.
- Block/unblock UI and final cross-domain enforcement.
- Notification persistence/read state for required types, minimal safe payload and transaction coupling.
- User/seller/listing/review suspension/removal/hide policy services and restoration validation.
- Audit-event foundation, privacy classification, retention/erasure/provider cleanup decision record.
- User-facing safety states and report/block entry points.
- Complete English and French report, block, suspension and notification interfaces; stable reason/status codes receive localized labels while authored evidence remains unchanged.

## Out of scope

Full admin pages (Phase 10), push/email notifications, automated content classification, appeals system, legal-policy drafting, user impersonation and bulk moderation.

## Database and routes/UI

Migrate reports, blocks if needed, notifications, moderation actions and relevant status/audit fields/indexes. Add `/[locale]/notifications` and locale-aware report/block controls; no public report routes. Admin-domain operations may be tested through internal services pending UI.

## Security requirements

Validate target exists and reporter can access it; keep reporter identity/internal notes confidential; require admin actor/reason for moderation; audit material actions; rate-limit/unique open reports. Blocks apply both directions and preserve history. Notifications follow committed state only and never embed private bodies. Suspension checked centrally on every capability.

## Tests and verification

Run gates/migrations. Cover each target/reason, invalid/inaccessible targets, duplicate/report flood, reporter confidentiality, self/duplicate blocks, every communication/contact effect, status propagation, restoration revalidation, notification rollback/read ownership/safe locale-prefixed links, audit append-only behavior, review aggregate hide/restore, log/DTO privacy and retention workflow dry run. Exercise user-facing safety and notification flows in English and French and verify authored report evidence is unchanged.

## Acceptance criteria

- [ ] Reports are valid, bounded, confidential and feed moderation states (`09`).
- [ ] Blocking consistently prevents prohibited contact while retaining evidence (`00`, `07`, `09`).
- [ ] Suspension/removal effects match every public/private domain (`09`).
- [ ] Notifications cannot survive failed transactions or expose content (`03`, `09`).
- [ ] Material actions require actor/reason and append audit data (`09`).
- [ ] Retention/erasure/asset/cache handling is documented before production (`03`, `09`).
- [ ] Direct security/integration/browser tests and gates pass (`04`, `10`).
- [ ] Safety, moderation-state and notification copy is complete in English and French, with stable internal codes independent of display language (`01`, `06`, `09`).

## Stop conditions

Stop for inconsistent block/suspension enforcement, reporter exposure, unaudited material action, false notification, destructive historical cascade, or undefined production retention.

## Handoff

Report migrations, policy matrix by status/domain, route/action DTOs, rate limits, notification transaction design, retention/erasure decision, audit examples, privacy/test evidence and exact admin service APIs for Phase 10.
