# Fik Jou3? — Moderation and Privacy

Status: Authoritative V1 safety and data-exposure contract

## Reports

Authenticated verified users can report `USER`, `SELLER`, `LISTING`, `MESSAGE`, or `REVIEW` targets for `SPAM`, `SCAM`, `INAPPROPRIATE_CONTENT`, `MISLEADING_LISTING`, `HARASSMENT`, `FOOD_SAFETY_CONCERN`, or `OTHER`. Details are plain text and required for `OTHER`; target validity and reporter visibility/access are checked server-side.

Report states are `OPEN`, `IN_REVIEW`, `RESOLVED`, `DISMISSED`. Users receive a neutral acknowledgement but do not gain access to internal notes, reporter identity, investigation data or another user’s reports. Prevent repeated open duplicates for reporter/target/reason and rate-limit attempts. A report never automatically proves wrongdoing.

## Blocking

Blocks are directed records but communication policy treats a block in either direction symmetrically: neither party can create a new conversation or send in an existing one. Existing member-visible history remains for context/evidence. Authenticated external-contact actions are suppressed. Blocking is idempotent, self-blocking is invalid, and the blocked user is not notified.

Public listings/seller pages stay public and can be visited while logged out; state this limitation instead of claiming invisibility. Whether unblocking restores communication depends on current statuses/preferences. Reviews from already completed interactions remain eligible within their window; users can report abusive reviews.

## Suspension and content actions

- **User suspended:** authenticated marketplace actions denied and active sessions invalidated/denied; owned seller/listings become unavailable for new public/contact activity; existing evidence remains available to authorized moderators and conversation members as policy permits.
- **Seller paused:** active listings are hidden/paused from discovery and new seller contact; account may still buy and manage/reactivate according to policy.
- **Seller suspended:** listings hidden; seller management/public contact disabled until admin resolution.
- **Listing removed:** excluded from public/discovery/SEO/contact; retained for conversations, reports and audit. Removal requires reason and actor.
- **Review hidden:** excluded from public view/aggregate; source record retained and aggregate reconciled transactionally.

Admin actions must be explicit and reversible where reasonable. Restoration revalidates current dependencies and does not blindly republish stale listings.

## Admin moderation and auditability

Admin pages allow inspect/act on only the required domains. Every suspension, restoration, listing removal, review hide/restore, report resolution and category state change records authenticated admin, action, target, reason, timestamp, correlation ID and safe before/after state. Audit records are append-only through normal application paths and do not store full secret/private payloads unnecessarily.

Admin authorization is server enforced per request. UI presence is irrelevant. Use least privilege; no user impersonation in V1. High-impact/bulk actions are out of scope unless explicitly specified later. Moderators cannot edit review ratings/comments or aggregate totals.

User-facing report/block/suspension/notification text and moderation-facing admin UI are complete in EN and FR. Reason enum labels are localized presentation over stable locale-neutral enum values; user-authored report details and reported content are never automatically translated. Moderators must see authored content unchanged and may not infer that interface locale is content language.

## Privacy classification and exposure

- **Public:** active listing content/media; seller display identity/bio; general area; public generalized coordinates; published reviews/aggregates; member-since.
- **Member-private:** own account/settings, favorites, notifications; conversation messages shared only with its members; completion/review submission state shown only as necessary.
- **Sensitive:** email, phone, phone verification, private coordinates, session/auth data, pending reviews, reports/reporter identity, moderation notes, storage/admin credentials.
- **Administrative:** minimum sensitive data necessary for a specific moderation task, exposed with authorization and audit.

Collect only data required for product behavior. Public endpoints use allow-listed projections; never select-all-and-strip. Phone is returned only by an authorized dedicated contact action. Private messages are not used for public discovery, advertising, or analytics content.

## Content handling

V1 user text is plain text, length bounded, escaped on render and subject to reporting. Images accept only validated raster types, strip unnecessary metadata/GPS, and use opaque names. No arbitrary user HTML, SVG upload, embedded script, or arbitrary external image URL is accepted.

When content is removed, prefer a neutral tombstone where participants need context. Do not expose internal moderation reasons publicly unless policy explicitly calls for it. Food-safety reports receive clear admin visibility but the platform must not claim governmental verification or guarantees.

## Retention, erasure and exports

Phase 09 must document retention periods and account-deactivation/erasure workflow before production. Legal deletion requests should redact personal fields while preserving only the minimum pseudonymous integrity records needed for fraud, reviews, reports and audit, subject to applicable policy. Provider assets and caches must be included in deletion/cleanup procedures. Backups and logs require bounded retention and access control.

Do not implement user data export or legal policy text unless explicitly added, but structure data so member-private data can be located. Never physically cascade historical trust/moderation data as an accidental side effect.

## Notifications

In-app types include `NEW_MESSAGE`, `NEW_REVIEW`, `REVIEW_PUBLISHED`, `LISTING_REMOVED`, and `SYSTEM`. Notifications contain minimal routing metadata, not message/review body or sensitive moderation detail. They are written only within/after a successful domain transaction, are audience-authorized on read, and point only to safe destinations. Read state is user-owned.

## Required verification

Test duplicate/report spam controls, target access, reporter confidentiality, both block directions, existing conversation behavior, every suspension effect, admin denial, reason/audit creation, transactional review aggregate changes, public DTO forbidden-field checks, EXIF removal, log redaction, removal/restoration behavior, and rollback with no false notification/audit result.
