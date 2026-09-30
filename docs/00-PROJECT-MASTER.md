# Fik Jou3? — Project Master

Status: Authoritative V1 specification

## Product vision

Fik Jou3? (Moroccan Darija for “Are you hungry?”) is a Morocco-first local marketplace for discovering homemade food made by nearby people. It connects a buyer with a home cook, helps them establish trust and communicate, then lets them arrange food details, pickup or delivery, location, and payment privately. The platform is not party to the resulting transaction.

The core product principle is binding: **if a feature does not meaningfully improve finding food, selling food, communication, safety, or trust, it probably does not belong in V1.**

### Core loops

- Buyer: discover → view listing → inspect seller and reputation → contact seller → arrange privately → mutually confirm completion when appropriate → optionally review.
- Seller: create account → add one optional seller profile → publish listings → receive contacts → arrange privately → mutually confirm completion → optionally review the buyer.

There is one universal user identity. Buying and selling are capabilities of the same account; selling is enabled by at most one attached seller profile. A seller may use a personal, kitchen, or informal brand display name and need not be a registered business.

## Immutable V1 boundaries

V1 includes universal accounts; optional seller profiles and public storefronts; food listings with 1–6 images; database-managed categories and optional tags; Morocco country/city/area data; privacy-preserving approximate map locations; grid and map discovery; PostgreSQL search, filters, sorting and pagination; favorites; platform messaging; optional phone and WhatsApp actions; pickup/delivery labels; mutual interaction completion; two-sided blind reviews and ratings; reports; blocking; in-app notifications; a small admin interface; responsive public/private experiences; indexable public listing/seller content; and complete English and French interface localization with future Arabic/RTL-ready foundations.

V1 excludes payments, checkout, carts, commissions, subscriptions, promotions, coupons, refunds, loyalty, platform delivery, drivers, inventory or quantity tracking, SKUs, portion stock, mandatory preparation schedules, order management, seller revenue analytics, restaurant operations, multi-item ecommerce orders, recommendation/ML systems, and native mobile applications. These exclusions must not be smuggled in through naming: the interaction record is not an order, listing availability is not inventory, and contact actions are not checkout.

Initial market and currency are Morocco and MAD. Countries and ISO-style currencies remain modeled so adding a country does not require a fundamental redesign. V1 interface locales are exactly English (`en`) and French (`fr`), with English as default/fallback; both must cover every product-controlled user-facing string, metadata field, accessibility label and admin surface. Arabic is not a V1 interface locale. Unicode-authored content, logical layout, and RTL-compatible component structure remain mandatory so Arabic can be added later without redesign.

## Architecture summary

Fik Jou3? is a modular monolith: one repository, one Next.js 16 application, and one PostgreSQL database. The intended stack is React 19, TypeScript, Tailwind CSS, shadcn/ui with Radix primitives, Drizzle ORM, Better Auth, Zod, React Hook Form where useful, Lucide React, MapLibre GL JS, repository-owned `next-intl` translation resources, PostgreSQL search, Vitest, Playwright, and real PostgreSQL integration tests.

Vercel and Neon free tiers are preferred portfolio deployment targets where feasible. Cloudinary may provide deployed images. No business rule may depend directly on those vendors. Storage, tile/geocoding, email, and other external services require narrow replaceable adapters. Free-tier limits are operational assumptions, never product guarantees.

Conceptual modules are `auth`, `users`, `sellers`, `listings`, `categories`, `locations`, `discovery`, `favorites`, `messaging`, `interactions`, `reviews`, `notifications`, `moderation`, `admin`, and `storage`. Module boundaries are enforced through server-side use cases and explicit DTOs, not through microservices. No Kafka, RabbitMQ, Elasticsearch, architectural-only API backend, or required Redis belongs in V1.

## Implementation principles

1. Authorization and domain invariants execute on the server. Client state and hidden controls are never authority.
2. PostgreSQL enforces important invariants with foreign keys, unique/check constraints, transactions, and deliberate indexes where reasonably possible.
3. Public reads use allow-listed DTO/select projections. Sensitive columns are never fetched with `select *` and stripped afterward.
4. Money is decimal-safe (`DECIMAL(12,2)` conceptually), with no authoritative JavaScript floating-point arithmetic.
5. Precise location, private messages, email, and phone are sensitive. Public map coordinates are independently generalized and can never be a serialization of private coordinates.
6. Plain text is the V1 content format for descriptions, messages, reviews, bios, and reports. Render it escaped; do not add rich-text/HTML support.
7. Marketplace records that contribute to trust, disputes, or moderation are deactivated/statused rather than destructively cascaded.
8. Accessibility, responsive behavior, error/loading/empty states, and tests are part of each feature’s completion, not Phase 11 cleanup.
9. Providers remain replaceable, but abstractions must stay small and evidence-driven.
10. Phases do not weaken constraints or use privileged seed/demo bypasses to make progress.
11. Product-controlled interface copy is keyed and centralized for complete EN/FR coverage. User-generated content is stored once and rendered exactly as authored; locale switching never translates or duplicates it.

## Phase order

Phases execute in numeric order: 00 Foundation; 01 Database & Auth; 02 Public Shell; 03 Seller & Listings; 04 Discovery & Search; 05 Maps & Location; 06 Favorites & Profiles; 07 Messaging; 08 Interactions & Reviews; 09 Moderation & Notifications; 10 Admin; 11 SEO & Polish; 12 V1 Certification.

Each phase must satisfy its prerequisites and acceptance criteria, pass its relevant tests, and produce a handoff before the next begins. Work may establish a forward-compatible schema earlier, but user-visible behavior belongs to the owning phase.

## Definition of V1 complete

V1 is complete only when Phase 12 audits every in-scope requirement and records it as `PASS` or `PASS WITH DOCUMENTED LIMITATION`; no in-scope `FAIL` remains. The production build, strict type check, lint, formatting check, unit tests, PostgreSQL integration tests, Playwright journeys, migration replay, deterministic seed verification, accessibility basics, responsive checks, SEO checks, privacy/security checks, and production-like smoke test must pass. The deployed architecture must operate without a paid-only dependency, within documented free-tier constraints.

## Specification decisions

These conservative resolutions remove ambiguity without expanding scope:

- **Interaction completion:** a listing-linked conversation owns one lightweight interaction. It becomes `COMPLETED` only after both buyer and seller independently confirm. Before the second confirmation, either party may withdraw their own confirmation. `CANCELLED` is not in the initial model; an open conversation can simply remain open or be archived in UI.
- **Review window:** completion opens a 14-day submission window. Each participant may submit one immutable review of the other. A submitted review stays hidden until both are submitted or the 14-day window expires. At expiry, a lone review publishes; no new review may be submitted afterward. Moderation can hide, not rewrite, a review.
- **Reputation context:** seller reputation uses reviews received as the seller in a completed listing interaction. Buyer reputation uses reviews received as the buyer. Listing cards may show seller reputation; listings do not have independent product-review ratings.
- **Location generalization:** public coordinates are generated from the selected area’s public centroid (or city centroid fallback) with a stable, bounded, non-identifying offset. They are not derived by rounding or slightly perturbing a private home pin. Exact coordinates are optional private data and are never returned by public DTOs.
- **Blocking:** a block in either direction disables new conversations and new messages in existing conversations for both parties. Existing history remains visible to its members for safety/evidence. Public marketplace pages remain public; authenticated contact actions are suppressed for a blocked pair. Blocking cannot promise anonymity from public web content.
- **Money and price:** every listing price must be strictly greater than `0.00`, use scale two, and use `MAD` in initial V1. Zero is not a valid price and must not mean free, negotiable, price on request, or missing. Any such concept requires an explicit future domain model rather than overloading `priceAmount`. Currency display and storage remain ISO-code aware.
- **Identity and slugs:** UUIDs are the default application identifier. Seller and listing slugs are globally unique, stable public identifiers; changing a title/display name does not silently change an existing slug. Collision suffixes are generated server-side.
- **Deletion:** users and marketplace entities are suspended/deactivated or soft-removed when history matters. Authentication-provider erasure and legally required deletion must anonymize or redact personal fields while retaining the minimum non-personal integrity/audit record allowed by policy.
- **External contact:** phone is never labeled verified unless `phoneVerifiedAt` exists. Phone/WhatsApp values are returned only by a dedicated authorized contact action, not embedded in discovery payloads.
- **Search:** V1 uses deterministic PostgreSQL relevance and declared sorts. “Popular” content may appear only when backed by a documented observable metric; no fake recommendations or personalization.
- **V1 locales:** supported interface locales are the closed typed set `en | fr`; English is the default/fallback and French is release-blocking first-class scope. Arabic remains future interface scope, while RTL/Unicode readiness stays mandatory.
- **Locale URLs and detection:** every application surface uses a leading locale segment (`/en/...`, `/fr/...`). Root `/` redirects using a valid persisted preference, then supported browser language, then English. An explicit valid locale in a URL always wins. Unsupported locale segments fail safely without redirect loops.
- **Localized versus authored data:** locale changes interface resources, platform taxonomy/location labels, formatting and metadata—not the underlying listing, seller, message or review record. No duplicated localized columns or entities are created for user-authored content.
- **Internationalization implementation:** `next-intl` is the planned free/open-source Next.js 16 App Router integration, with repository-owned resources, typed locale identifiers, centralized namespaces, server/client support and development/test failure on missing French keys. Phase 01 pins the exact compatible version and establishes routing/resources before auth UI.

## Known implementation-time decisions

The following must be recorded before implementation in their owning phase, without changing the invariant: exact rate-limit numbers and persistence mechanism; selected email, image, tile, and geocoding providers; the public-coordinate offset radius appropriate to Moroccan area density; search configuration/language normalization; pagination style; and production retention periods. These are unresolved implementation details, not unresolved product scope.
