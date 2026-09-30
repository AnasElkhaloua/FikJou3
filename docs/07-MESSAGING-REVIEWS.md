# Fik Jou3? — Messaging, Interactions and Reviews

Status: Authoritative V1 trust-flow contract

## Conversation identity and creation

A conversation is a private, listing-linked channel between one buyer and the seller who owns that listing. PostgreSQL is authoritative. Unique `(listingId, buyerUserId, sellerUserId)` prevents duplicate threads; creation uses insert-on-conflict/re-read in one transaction. The server derives seller identity from the listing and buyer from session. Self-conversation is forbidden.

Creation requires a verified active buyer, active listing and seller, seller platform messaging enabled, and no block in either direction. Existing conversation reuse does not bypass current send policy. Store an immutable listing reference and retain enough safe snapshot context to explain old conversations if the listing later changes/removes.

## Membership and messages

Exactly the buyer and seller are members. Every list/read/send/mark-read operation verifies session membership. Inbox queries reveal only a member’s conversations. Messages are plain text with server-set sender/time, validated nonblank length, and deterministic ordering by `(createdAt,id)`.

V1 may poll/revalidate; no heavy realtime infrastructure is required. Polling must stop/background sensibly and avoid duplicate display. Optimistic messages need client IDs/idempotency or disabled repeat submission so retries do not silently duplicate.

Inbox, conversation, completion and review interface copy, timestamps, validation and accessibility labels are complete in EN and FR. Message and review bodies are user-generated content: store/render one authored value and never translate or duplicate it when locale changes. Deep language switching preserves the conversation/review destination only after the same authorization check in the target locale.

Editing is optional and may be omitted. If implemented, retain `editedAt` and authorize only the sender within a documented window. Deletion, if exposed, shows a tombstone and does not destroy moderation evidence. No attachments are required.

## Blocking and lifecycle effects

A block in either direction prevents new conversation creation and new messages by either side. Existing history stays visible to members, with composer disabled and a neutral safety explanation. Unblocking may restore sending only if user/seller/listing status and preferences still permit it. Suspended/deactivated users cannot send; seller/listing suspension prevents new listing-origin contact while history remains accessible to members/admins as policy allows.

External phone/WhatsApp actions follow the same known block/status policy, while public page visibility cannot guarantee anonymity from logged-out visitors. This limitation must be stated in safety copy rather than overpromising.

## Interaction state machine

Each conversation has one interaction:

`OPEN` → `COMPLETED`

While open, buyer and seller have independent confirmation timestamps. Either party can set or withdraw only their own confirmation. When both are present, one locked transaction sets `COMPLETED`, `completedAt`, and `reviewWindowEndsAt = completedAt + 14 days`; completion is then irreversible to users. It records mutual acknowledgement of an exchange only—never an order, payment, delivery or food-safety guarantee.

There is no `CANCELLED` state in initial V1 because an unused conversation can remain open/archive in UI. Admin correction of fraudulent/accidental completion, if later needed, requires an explicit audited policy before implementation and must reconcile reviews/ratings.

## Review eligibility

A user may submit when all conditions hold: authenticated active participant; interaction completed; current time not after `reviewWindowEndsAt`; reviewer has not reviewed this interaction; reviewee is the other participant; context matches reviewer’s buyer/seller role; rating is integer 1–5; comment is optional validated plain text. Blocking after completion does not erase review eligibility, but review surfaces must not enable harassment; reports/moderation remain available.

One review per reviewer per interaction is enforced by a database unique constraint. Users cannot edit or delete a submitted review. This protects blind behavior and aggregates; moderation can hide it with audit history.

## Blind publication lifecycle

1. First valid submission creates `PENDING`, hidden from counterpart/public, with `publishAt = reviewWindowEndsAt`. Notify the counterpart only that a review opportunity exists, not rating/comment.
2. If the second valid review arrives before/at the deadline, publish both in the same transaction and emit publication notifications after the commit.
3. At/after the deadline, a due publisher (scheduled task or safe idempotent reconciliation invoked by reads) changes a lone pending review to `PUBLISHED`. Submissions after the deadline are rejected.
4. A hidden-by-moderation review is excluded from public views and aggregates. The original record and moderation action remain authoritative.

All time comparisons use server/database time. Reconciliation is idempotent and concurrency tested. No public API reveals that a pending review exists, its author, rating or text before publication.

## Reputation and aggregation

Seller reputation aggregates published reviews where the reviewee participated as seller; buyer reputation aggregates those where reviewee participated as buyer. Listing cards/profile show seller context only. Do not merge contexts or create per-listing product ratings.

Review rows are authoritative. Aggregate count/sum/average may be cached transactionally; publication/hiding adjusts it once, protected by status transitions/locking. Display average with a documented rounding rule (recommended one decimal) while retaining exact sum/count. Zero reviews displays “New”/no rating, never `0 stars`. Provide an audit/rebuild query and test it against cached values.

## Abuse and privacy cases

- No interaction, unilateral completion, self-review, duplicate review, swapped reviewee, expired review, or client-supplied role is accepted.
- Pending content is inaccessible through APIs, notifications, metadata, logs and aggregate changes.
- Reports can target published reviews and messages accessible to the reporter. Admin access is audited.
- Rate-limit conversation creation, message sends and review submissions without replacing database constraints.
- Message bodies and review drafts are not logged. Search engines never index conversations or pending reviews.
- Removing a listing/account does not silently erase eligible trust/moderation evidence; public identity may be anonymized according to policy.

## Required tests

Test unique creation under concurrency; non-member reads/sends; all block directions; status/preference changes; message ordering/unread; both confirmation orders and withdrawals; transactional completion; every eligibility rejection; simultaneous reviews; lone expiry publication; late submission; pending invisibility; moderation aggregate subtraction; rebuild equality; rollback without notification; and buyer/seller context separation.
