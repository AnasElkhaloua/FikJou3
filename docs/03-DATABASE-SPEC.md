# Fik Jou3? — Database Specification

Status: Authoritative conceptual schema; physical names finalized in Phase 01

## Conventions

Use PostgreSQL, Drizzle migrations, UUID application identifiers, `timestamptz` timestamps, Unicode text, lowercase unique normalized email through Better Auth, explicit foreign keys, and database enums or equivalent checks for stable states. Store money as `numeric(12,2)` plus three-letter currency code. Whenever `priceAmount` is present it must be strictly greater than zero; PostgreSQL must enforce `CHECK (price_amount > 0)`. All timestamps are server/database generated in UTC.

Physical schema may adapt to Better Auth’s required tables, but the invariants below are mandatory. Every table receives only useful indexes backed by access patterns. Migration files are immutable after use and replayable from an empty database.

## Identity and marketplace tables

### Auth/User

Better Auth owns its required user, account, session, verification and reset structures. The marketplace user record/extension must provide: `id`, `email` (private), optional `emailVerifiedAt` or provider equivalent, optional `phoneNumber` (private), optional `phoneVerifiedAt`, optional `preferredLocale` constrained to `en | fr`, `status` (`ACTIVE`, `SUSPENDED`, `DEACTIVATED`), admin role/permission, and created/updated timestamps. Locale preference is UI state, not content language; explicit URL locale remains authoritative. An unverified phone never yields a verified flag. Index session/user and status/admin lookups required by auth/admin.

### SellerProfile

`id`, `userId`, `displayName`, globally unique `slug`, plain-text `bio`, optional avatar `storageKey`/safe delivery locator, `cityId`, optional `areaId`, `status` (`ACTIVE`, `PAUSED`, `SUSPENDED`), `allowPlatformMessages`, `allowWhatsApp`, `allowPhone`, optional private contact phone reference/value, timestamps.

Constraints: unique `userId`; nonblank display name/slug; area must belong to selected city (enforce with composite keys/trigger or transactional validation plus integration test); contact mode may only use a present valid contact value; phone verification is independent. Index status, city/area, slug.

## Taxonomy and geography

- `countries`: `id`, unique uppercase `code`, stable key/slug, `currencyCode`, `active`.
- `countryTranslations`: `countryId`, `locale`, `name`; unique `(countryId, locale)` with locale check `IN ('en','fr')`.
- `cities`: `id`, `countryId`, stable `slug`, public centroid latitude/longitude, `active`; unique `(countryId, slug)`.
- `cityTranslations`: `cityId`, `locale`, `name`; unique `(cityId, locale)` with the supported-locale check.
- `areas`: `id`, `cityId`, stable `slug`, public centroid latitude/longitude, `active`; unique `(cityId, slug)`; also expose a composite uniqueness usable for city/area integrity.
- `areaTranslations`: `areaId`, `locale`, `name`; unique `(areaId, locale)` with the supported-locale check.
- `categories`: `id`, stable unique `slug`/key, optional icon key/name, `sortOrder`, `active`, timestamps.
- `categoryTranslations`: `categoryId`, `locale`, `name`, timestamps; unique `(categoryId, locale)` with the supported-locale check.
- `tags`: `id`, stable unique `slug`/key, `active`, timestamps. Platform-managed tags use `tagTranslations` with the same `(tagId, locale)` invariant; truly user-entered/freeform tags, if later permitted, remain authored once and are not translated.

Latitude checks are `[-90,90]`, longitude `[-180,180]`. Initial seed includes Morocco (`MA`, `MAD`), representative cities/areas, and candidate categories with complete EN and FR labels. Seed upserts stable locale-neutral keys plus `(entityId, locale)` translations and is repeatable. A category/location cannot be activated for V1 until both EN and FR names exist; enforce this multi-row invariant transactionally in admin/seed services and integration tests.

Do not add locale columns or localized copies to listings, seller profiles, messages, reviews or other user-authored marketplace records. There are no `listing_title_en`, `listing_title_fr`, duplicated localized listings, or inferred content-language translations. Translation rows are reserved for platform-controlled vocabulary.

## Listings and media

### Listing

`id`, `sellerProfileId`, `categoryId`, `cityId`, optional `areaId`, `title`, globally unique stable `slug`, plain-text `description`, `priceAmount numeric(12,2)`, `currencyCode`, booleans `pickupAvailable` and `deliveryAvailable`, `status` (`DRAFT`, `ACTIVE`, `PAUSED`, `REMOVED`), optional `publishedAt`, timestamps, optional private latitude/longitude, required-on-publish public latitude/longitude and generalization version/metadata. `priceAmount` may be null only while an incomplete draft is being saved; all publishable states require it.

Constraints: PostgreSQL `CHECK (price_amount > 0)` so every non-null stored price is strictly positive; currency code format; at least one fulfillment mode for `ACTIVE`; area/city integrity; coordinate ranges; an active listing has a non-null price plus category/location/seller eligibility, publication timestamp and 1–6 committed images (multi-table publication rules are transactionally enforced in service logic and tested). Neither application code nor seeds may store `0.00` as free, negotiable, price on request, missing, or a draft sentinel. Index seller/status, category/status, city/area/status, publishedAt, price, and public coordinates/spatial strategy selected in Phase 05. Removed is terminal.

### ListingImage and tags

`listingImages`: `id`, `listingId`, opaque unique `storageKey`, safe provider locator if needed, `width`, `height`, MIME/format, byte size, `sortOrder`, timestamps. Unique `(listingId, sortOrder)`; positive dimensions/size; committed count maximum six enforced transactionally. Sort order zero (or documented lowest value) is cover.

`listingTags`: `listingId`, `tagId`, composite primary/unique key. Tags are optional.

Search uses a generated/materialized PostgreSQL text-search representation or indexed expression over listing text plus joined seller/category/tag data. Phase 04 records exact refresh strategy and language normalization; updates must not leave stale discoverability. Category/location/platform-tag display/search joins select the requested supported locale and may use explicit English fallback only for corrupted/incomplete administrative data while surfacing that defect; user-authored content remains unchanged.

## User actions and communication

- `favorites`: `userId`, `listingId`, `createdAt`; composite primary/unique `(userId, listingId)`, indexes for user recency and optional listing counts.
- `conversations`: `id`, `listingId`, `buyerUserId`, `sellerUserId`, timestamps, optional archive timestamps. Unique `(listingId, buyerUserId, sellerUserId)`; buyer differs from seller. Seller user must be the listing owner at creation.
- `conversationMembers`: `conversationId`, `userId`, `joinedAt`, optional `lastReadAt`; unique pair. Exactly the buyer and seller are members; create conversation and both memberships in one transaction.
- `messages`: `id`, `conversationId`, `senderId`, plain-text `body`, `createdAt`, optional `editedAt`, optional `deletedAt`. Sender membership and block/status policy are transactionally verified. Index `(conversationId, createdAt, id)` and unread-related access path.
- `interactions`: one per conversation (`conversationId` unique), `status` (`OPEN`, `COMPLETED`), nullable buyer/seller confirmation timestamps, nullable `completedAt`, `reviewWindowEndsAt`, timestamps. `COMPLETED` requires both confirmations, a completion time, and window end exactly 14 days later. No cancelled/order/payment fields.

## Reviews and reputation

`reviews`: `id`, `interactionId`, `reviewerUserId`, `revieweeUserId`, `reviewerContext` (`BUYER`, `SELLER`), rating small integer, plain-text optional comment, `submittedAt`, `publishAt`, nullable `publishedAt`, status (`PENDING`, `PUBLISHED`, `HIDDEN_BY_MODERATION`), optional moderation metadata. Unique `(interactionId, reviewerUserId)`; rating 1–5; reviewer/reviewee differ. Participants/context/eligibility and deadline are checked transactionally.

The first review uses `publishAt = reviewWindowEndsAt`; if counterpart submits, both publish in the same transaction. A due-publication job/read-safe reconciliation publishes lone eligible reviews at/after deadline. Reviews are immutable to users.

`ratingAggregates` may store `userId`, context, count, sum, average, updatedAt with unique `(userId, context)`. Review rows are authoritative. Aggregate updates occur in the publication/moderation transaction and can be rebuilt/audited; hidden pending reviews never count.

## Safety, notifications and administration

- `userBlocks`: `blockerUserId`, `blockedUserId`, `createdAt`; unique pair; self-block check; index reverse lookup.
- `reports`: `id`, `reporterUserId`, `targetType` (`USER`, `SELLER`, `LISTING`, `MESSAGE`, `REVIEW`), `targetId`, reason enum, plain-text details, status (`OPEN`, `IN_REVIEW`, `RESOLVED`, `DISMISSED`), timestamps, resolver and resolution note. A partial/open uniqueness or rate-limit prevents obvious duplicate active reports. Polymorphic target validity is checked by the domain because one FK cannot cover multiple tables.
- `notifications`: `id`, `userId`, type enum, optional actor, entity type/id, optional `readAt`, `createdAt`; index `(userId, readAt, createdAt)`. Created only with a committed domain event.
- `moderationActions`: `id`, `adminUserId`, action type, target type/id, reason, safe structured before/after state, `createdAt`, correlation ID. Append-only to application users.

## Deletion and history

Do not cascade-delete users, sellers, listings, conversations, reviews, reports or moderation history merely because an account/listing is deactivated. Use statuses and redact/anonymize personal content when required. Cascades are appropriate only for non-historical dependents such as an abandoned draft’s images/tags, subject to storage cleanup, or a favorite when its user/listing is physically purged under a controlled erasure process.

Messages may carry a deletion timestamp while preserving an audit-safe placeholder. Removed listings retain minimum title/context for conversation/report evidence but are not discoverable. Category/location deactivation does not rewrite historic references. Physical purge/retention rules require a documented privacy policy and admin-controlled process.

## Transaction and concurrency invariants

Use transactions and conflict-safe unique constraints for favorite toggles, conversation creation, image ordering, completion confirmation, review submission/publication, rating aggregation, reports, notification creation and moderation. Treat uniqueness violations as idempotent success or a safe conflict as appropriate. Lock/re-read the interaction when the second completion/review arrives. Never calculate aggregates from client input.

## Required schema verification

Integration tests must prove every unique/check/foreign-key invariant, ownership-aware transition, rollback behavior, migration replay, and seed repeatability. Price tests must prove PostgreSQL rejects `0.00` and negative values, accepts the smallest supported positive scale-two value, and application validation rejects invalid prices before persistence. Tests must use PostgreSQL, not an incompatible in-memory substitute. `10-TESTING-QUALITY.md` defines gates.
