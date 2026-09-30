# Phase 10 — Admin

Status: Sequential implementation contract

## Objective and prerequisites

Build the small protected admin interface over Phase 09 moderation services, with least privilege and auditable actions. Requires the policy matrix, reports and audit foundation complete.

## In scope

- `/[locale]/admin` summary focused on actionable reports/status, not business analytics.
- `/[locale]/admin/users`, `/[locale]/admin/sellers`, `/[locale]/admin/listings`, `/[locale]/admin/reports`, `/[locale]/admin/categories` list/detail/filter/pagination.
- Suspend/restore user and seller, remove/restore listing where valid, hide/restore review where surfaced through reports, resolve/dismiss reports, manage category name/slug/icon/order/active.
- Required reason/confirmation, safe before/after audit, clear success/error states.
- Server-enforced role/permission checks on layouts, reads and every mutation.
- Complete English and French admin UI, including validation, confirmations, statuses and audit labels. Category management requires both English and French labels for active records.

## Out of scope

Giant CMS, arbitrary SQL/data editing, impersonation, financial analytics, automated moderation, bulk destructive actions and unaudited direct aggregate edits.

## Database and routes/UI

Only migrations needed for gaps discovered against the already specified audit/category/status model; any gap requires spec update. Admin routes are dynamic, private, `noindex`, absent from sitemap and use audience-specific DTOs that minimize sensitive data.

## Security requirements

Check active authenticated admin permission server-side per operation; do not rely on layout/menu. Apply least privilege and safe pagination/query validation. Require nonblank reason for material action and atomically write audit. Protect CSRF/rate abuse, redact sensitive fields/logs, prevent self-escalation and category slug collisions. Admin UI must not display password/session/token/private coordinates unless a separately specified safety necessity exists (none by default).

## Tests and verification

Run gates/migrations. Test anonymous/user/suspended-admin denial by calling endpoints directly; authorized reads/actions; reason requirement; action/status validation; report resolution; audit correctness/immutability; rollback; review aggregate hide/restore; category translation completeness/effects; noindex/cache/private DTO. Playwright exercises representative report→inspect→act→audit and category workflow in English and French with keyboard/accessibility checks.

## Acceptance criteria

- [ ] All required admin routes/capabilities exist and no CMS/analytics scope was added (`01`, `06`, `09`).
- [ ] Every read/action is server-authorized; direct non-admin requests fail (`04`).
- [ ] Material actions atomically create complete safe audit records (`09`).
- [ ] Suspension/removal/restore respects central policy and current dependencies (`09`).
- [ ] Admin pages are non-indexable, non-publicly cached and data-minimized (`04`, `06`).
- [ ] Reviews/ratings cannot be manually rewritten (`07`, `09`).
- [ ] Accessibility, integration, browser and standard gates pass (`05`, `10`).
- [ ] Every admin surface is complete in English and French, and active category changes cannot omit either locale label (`01`, `03`, `06`).

## Stop conditions

Stop on any privilege bypass, unaudited action, overly broad sensitive data view, manual trust-record alteration, public caching/indexing, or demand for out-of-scope CMS features.

## Handoff

Report route/capability matrix, permission model, admin DTO fields, action/audit samples, negative authorization evidence, accessibility/browser results, migrations if any and Phase 11 hardening items.
