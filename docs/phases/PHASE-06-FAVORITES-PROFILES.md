# Phase 06 — Favorites and Profiles

Status: Sequential implementation contract

## Objective and prerequisites

Add saved listings, user profile/settings and seller contact preferences, with reputation placeholders that do not fabricate reviews. Requires active listing discovery and location privacy complete.

## In scope

- Favorite/unfavorite idempotent actions and `/favorites` page.
- User `/profile` and `/settings` for allowed basic/account presentation fields.
- Seller profile/contact preferences: platform messages, WhatsApp, phone; normalized contact storage and clear unverified state.
- Seller public reputation placeholder (“New”/no rating) until Phase 08.
- Complete EN/FR favorites/profile/settings/contact-preference UI, states, validation and locale-aware formatting.
- Graceful favorites when listing becomes paused/removed, according to privacy-safe product behavior.

## Out of scope

Reviews/aggregates, messaging implementation, phone OTP/verification, push/email notifications, user directory, public buyer profile, order history and analytics.

## Database and routes/UI

Migrate favorites unique pair if not already present and any finalized contact-preference fields. Add `/favorites`, `/profile`, `/settings`; enhance seller public/management pages. Contact values must not be embedded in public discovery payloads; actual reveal waits for Phase 07 action.

## Security requirements

All settings/favorites are session-owned; favorite target must be public/eligible; enumeration-safe unavailable handling. Normalize phone/WhatsApp server-side, never mark verified, encrypt/restrict storage if chosen, redact logs, and expose only enablement booleans in ordinary public DTOs. Protect mutations with rate/CSRF mechanisms.

## Tests and verification

Run standard gates/migrations/resource parity. Test favorite uniqueness/concurrency/idempotency, cross-user access, listing state changes, settings ownership, locale preference synchronization without authorization effects, invalid contact input, preference combinations, public DTO/source/log absence of phone/email, and localized “New” reputation. Playwright favorites/settings and route-preserving language switching in EN/FR at mobile/desktop.

## Acceptance criteria

- [ ] Favorite pair is unique and save/remove is retry-safe (`03`).
- [ ] Users see only their saved/private profile data (`04`, `09`).
- [ ] Unavailable favorites do not restore or leak private listing data (`06`, `09`).
- [ ] Contact preferences are editable but values stay out of discovery/page payloads (`01`, `04`).
- [ ] No phone is shown as verified and no OTP is implied (`00`, `04`).
- [ ] Zero reviews renders no fabricated rating (`05`, `07`).
- [ ] Favorites/profile/settings/contact UI and states are complete in EN and FR; locale preference never changes ownership or duplicates profile/content records (`00`, `01`, `03`, `04`, `10`).
- [ ] Responsive/accessibility and all gates pass (`05`, `10`).

## Stop conditions

Stop on cross-user favorite/settings access, public contact leakage, false verification, or schema/UI pressure to create separate buyer/seller accounts.

## Handoff

Report migrations/routes, favorite semantics, contact normalization/storage and DTOs, privacy tests, state screenshots, command results and the contact-action contract required by Phase 07.
