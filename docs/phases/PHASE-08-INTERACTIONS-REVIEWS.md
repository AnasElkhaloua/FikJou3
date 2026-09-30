# Phase 08 — Interactions and Reviews

Status: Sequential implementation contract

## Objective and prerequisites

Add mutual interaction completion, 14-day blind two-sided reviews and contextual rating aggregates without creating orders. Requires Phase 07 authorized conversations.

## In scope

- One interaction per conversation; buyer/seller independent confirmation and withdrawal before completion.
- Atomic mutual completion and 14-day review deadline.
- Review eligibility, immutable submission, pending secrecy, mutual immediate publication, lone expiry publication/reconciliation.
- Seller- and buyer-context aggregate count/sum/average with rebuild/audit.
- Conversation/profile review UI and honest “New” states; review rate limiting/abuse validation.
- Complete English and French completion, deadline, review and reputation UI; authored review text remains one untranslated record.

## Out of scope

Orders/payment/delivery status, unilateral completion, review editing, arbitrary public reviews, product/listing ratings, admin moderation UI (Phase 10) and cancellation workflow.

## Database and routes/UI

Migrate interactions, reviews, aggregate cache and constraints/indexes. Add completion controls/status to conversation; review submission/result surfaces; published seller reviews/reputation and appropriate private buyer-context view. Any scheduled expiry mechanism must have idempotent on-read/worker fallback and documented deployment behavior.

## Security requirements

Derive participant/context/reviewee from conversation, use database time/locks, enforce unique review, reject expired/early/duplicate/self attempts, never return pending content, rate-limit submission. Publish reviews and update aggregates/notifications transactionally. Plain text only; no client aggregate/publication control.

## Tests and verification

Run all gates/migrations. Test confirmation orders/withdrawal/concurrency, no unilateral completion, exact deadline boundaries, both submission orders/simultaneous submits, lone expiry, late rejection, pending secrecy in all audiences, context separation, moderation-ready hide/rebuild, transactional rollback and notification absence. Playwright covers mutual completion, mutual reviews and deterministic clock-controlled lone review in English and French, with locale-correct dates/numbers and unchanged authored review text.

## Acceptance criteria

- [ ] Completion occurs only after both confirmations and is not an order (`00`, `07`).
- [ ] Eligibility requires participant/completed/window/unique/counterpart rules (`07`).
- [ ] First review remains hidden until counterpart or 14-day expiry (`00`, `07`).
- [ ] Publication and aggregate updates are idempotent/transactional (`03`, `07`).
- [ ] Seller and buyer reputations remain context-separated; no listing rating (`00`, `07`).
- [ ] Pending content is absent from APIs/UI/notifications/logs (`04`, `07`, `09`).
- [ ] Abuse, boundary, concurrency and browser journeys pass (`10`).
- [ ] Completion/review states, validation and reputation labels are complete in English and French without localizing user-authored reviews (`01`, `06`, `07`).

## Stop conditions

Stop if one user can manufacture eligibility, pending review leaks, clock/concurrency permits duplicates, aggregates diverge without repair, or the model gains order/payment semantics.

## Handoff

Report migration/state diagrams, exact clock/deadline behavior, reconciliation scheduling, DTOs, rate limits, concurrency and aggregate-rebuild evidence, browser results and moderation hooks for Phase 09/10.
