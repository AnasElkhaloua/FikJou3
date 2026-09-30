# Phase 07 — Messaging

Status: Sequential implementation contract

## Objective and prerequisites

Deliver secure listing-linked conversations, messages, inbox/unread state, block-aware communication and authorized external contact actions. Requires contact preferences and active listing/seller flows.

## In scope

- Conversation/member/message schema and unique buyer+seller+listing invariant.
- Start-or-reuse conversation, inbox, thread, send, polling/revalidation and last-read/unread behavior.
- Retained safe listing context; plain-text validation; deterministic ordering/idempotent retry behavior.
- Preliminary block enforcement using shared policy (block UI/final moderation arrives Phase 09).
- Dedicated authorized phone/WhatsApp actions respecting preferences, verification wording, status and blocks.
- Message/conversation rate limits and safe status transitions when account/listing/seller changes.
- Complete English and French inbox, thread, unread, composer, status and external-contact interface copy; user-authored message bodies remain one untranslated record.

## Out of scope

Attachments, typing/presence, WebSockets/broker, group chat, rich text, orders, completion UI/state (Phase 08), reports/notification center (Phase 09), push notifications.

## Database and routes/UI

Migrate conversations, members, messages and indexes; introduce block table/policy if not already present but defer full management UI. Add `/[locale]/messages`, `/[locale]/messages/[conversation]`, message-start and contact-reveal actions. Routes are private/non-indexable and accept only supported locales.

## Security requirements

Derive buyer from session and seller from listing; reject self/contact-ineligible flows. Verify membership on every query/mutation and block either direction. Do not cache private threads publicly or log bodies/contact. Normalize safe `tel:`/WhatsApp links server-side; never accept arbitrary external URLs. Apply send/create/contact reveal limits and suspended/deactivated checks.

## Tests and verification

Run gates/migrations. Integration concurrency proves one conversation, exactly two correct members, cross-user isolation, sender membership, message ordering, unread/read, block both directions, preference/status/listing changes, retry duplicates and rollback. DTO tests reject phone/private coordinates outside dedicated action. Playwright runs buyer start, seller reply, reuse, unread, blocked composer and contact actions on mobile/desktop in English and French, including a locale switch that retains the authorized conversation and leaves message bodies unchanged.

## Acceptance criteria

- [ ] Duplicate conversation race resolves to one authorized thread (`03`, `07`).
- [ ] Non-members cannot discover/read/send and errors do not enumerate (`04`, `07`).
- [ ] Blocks in either direction stop new/existing sends while history remains (`00`, `09`).
- [ ] PostgreSQL is authoritative; polling provides reasonable UX without heavy infra (`02`, `07`).
- [ ] External contact is opt-in, dedicated, normalized and absent from discovery (`01`, `04`).
- [ ] No message body/contact/private location enters logs/public cache (`04`, `09`).
- [ ] Inbox/thread states, accessibility and all gates pass (`05`, `06`, `10`).
- [ ] Messaging/contact UI is complete in English and French while authored message content is never translated or duplicated (`01`, `06`, `07`).

## Stop conditions

Stop on any membership bypass, contact/private data leakage, duplicate thread invariant failure, blocked send path, public caching, or pressure to introduce order/realtime infrastructure.

## Handoff

Report migrations, uniqueness/concurrency method, route/action DTOs, poll/unread behavior, rate limits, block/contact policy evidence, security tests and Phase 08 interaction attachment point.
