# Fik Jou3? — Product Specification

Status: Authoritative V1 product contract

## Actors and roles

- **Visitor:** browse/search public listings, categories and seller profiles; cannot favorite, message, review, report as a user, or manage content.
- **User:** one authenticated identity able to browse, favorite, contact, message, report, block, complete eligible interactions, and review eligible counterparties.
- **Seller:** the same user with one optional seller profile. Can manage that profile and its listings and can participate as either buyer or seller in different interactions.
- **Admin/moderator:** an authenticated user with server-verified administrative permission. Admin capability does not imply ownership of marketplace content and all material actions are audited.

Account roles are capabilities, not separate account types. A suspended user cannot use authenticated marketplace actions. A paused seller keeps account capabilities but the storefront/listings follow visibility rules. A suspended seller cannot publish or receive new listing-linked contact.

## Functional requirements

### Interface languages

- V1 supports complete English (`en`) and French (`fr`) interfaces. English is the default/fallback; French is not a beta, placeholder or partial locale.
- Every product-controlled user-facing string is translated: navigation, actions, headings, labels, placeholders, filters, category/location display labels, instructions, validation/auth errors, seller/listing/discovery/map/favorites/messaging/review/notification/settings/report/block/admin UI, empty/loading/error text, accessibility names, confirmations and public SEO metadata.
- All application routes are locale-aware. Switching EN/FR preserves the current logical route, slug and safe query state where practical and does not require authentication.
- Dates, relative times, numbers and MAD prices use locale-aware `Intl`/internationalization-library formatting without changing stored values.
- User-generated listing titles/descriptions, seller names/bios, messages and reviews are never automatically translated or duplicated per locale. They render exactly as authored, subject to normal validation/moderation and safe bidirectional display.
- Arabic is not a V1 interface locale. User content may contain Arabic/Darija, and the component/layout foundation remains RTL-ready for future Arabic UI.

### Accounts and seller identity

- Users register with email/password, verify email, sign in/out, and reset passwords through Better Auth.
- A user may create at most one seller profile with display name, stable slug, bio, image, city/area, status, and contact preferences.
- Seller names may be personal, kitchen, informal brand, Latin, Arabic, French, or Darija; business registration is not required or implied.
- Public profiles show only display identity, general area, active listings, seller-context rating/review count and reviews, member-since date, and enabled contact actions.

### Listings and media

- A seller can create a draft with 1–6 ordered photos, title, plain-text description, a decimal-safe price strictly greater than `0.00`, one category, city/area, at least one of pickup/delivery, optional tags, and lifecycle state. Application validation rejects zero or negative prices. Zero must not represent free, negotiable, price on request, or missing; those concepts require an explicit future specification and model.
- Publishing requires all mandatory fields and an active seller, category, city and area. Drafts may be incomplete. Active listings are public; paused and removed listings are excluded from discovery and ordinary public detail.
- The seller can edit owned listings and transition `DRAFT → ACTIVE`, `ACTIVE ↔ PAUSED`, and any non-removed state → `REMOVED`. Removed is terminal for V1.
- Images have an explicit cover/order, validated format/MIME/size, opaque keys, cleanup behavior, and no exposed GPS EXIF.
- The product never asks for stock, quantity, SKU, variants, portion inventory, revenue, or mandatory preparation schedules. Sellers explain unusual availability in the description.

### Discovery and contact

- Grid discovery is the default and emphasizes photography, title, price, general area, seller rating where available, and favorite state.
- Search covers listing title/description plus seller display name, category, and tags where practical. Filters cover city, area, category, price, pickup, and delivery; declared sorts are newest, price ascending/descending, and seller rating.
- Map discovery uses only generalized public coordinates and supports result bounds. Desktop can show split results/map; mobile opens a primarily full-screen map.
- Authenticated users can favorite a listing once and manage saved listings.
- Listing detail offers platform message and, when enabled, explicit WhatsApp/call actions. Contact data is not present in search/list payloads. The platform never represents contact as an order or payment action.

### Messaging, trust and safety

- An authenticated buyer can start at most one conversation with a particular seller for a particular listing. A seller cannot start a buyer conversation with themselves.
- Only conversation members can read its messages/history. Members can send plain text while both accounts/listing relationship permit it and neither has blocked the other.
- Both participants must confirm completion before reviews become eligible. Completion does not attest to payment, food safety, or delivery by the platform.
- Each participant can submit one 1–5 star review of the other during the 14-day window. Blind publication and contextual ratings follow `07-MESSAGING-REVIEWS.md`.
- Users can report supported targets and block other users. Blocking immediately stops direct platform communication in both directions while preserving member-visible history.
- In-app notifications cover messages, review events, listing moderation, and system events; a notification must correspond to a committed domain change.

### Admin and moderation

- The protected admin area supports inspecting users, sellers, listings, reports, and categories; suspending users/sellers; removing listings; resolving reports; and managing category metadata.
- Material moderation actions record actor, action, target, reason, timestamp, and safe before/after metadata.
- Admin is intentionally not a general CMS, analytics suite, or impersonation facility.

## Product rules

1. A listing belongs to exactly one seller profile, and ownership always resolves from the authenticated user through that profile.
2. A public listing requires an active seller, active category/location, publishable content, at least one image, and pickup or delivery.
3. Buyers and sellers privately agree on availability, quantity, preparation, fulfillment, exact meeting location, and payment. UI copy must not imply platform fulfillment, guarantees, checkout, or escrow.
4. Reputation requires a mutually completed interaction; public reviewing without eligible contact is impossible.
5. Reviews and aggregate ratings are derived records, never user-editable totals.
6. Public location is approximate. Exact pickup information belongs only in private communication.
7. External contact is opt-in per seller and suppressed when policy, suspension, or a known block relationship requires it.
8. Categories are data managed by admins and seeded initially; category names are not hardcoded domain branching.
9. Tags are optional enrichment. Missing tags never block publication.
10. Empty, loading and error states are functional requirements. Serious safety and moderation states use direct, non-playful language.
11. `priceAmount > 0` is a V1 invariant in application validation and PostgreSQL. Draft persistence may not use zero as a placeholder; an incomplete draft uses an absent value until a valid positive price is supplied.
12. Locale affects interface presentation and metadata, not marketplace identity. The same listing/seller slug resolves the same record below `/en` and `/fr`.
13. Missing French product copy is a defect. Development and tests must expose missing keys instead of silently shipping broad English fallback inside French pages.

## Experience requirements

Mobile-first critical flows are browse, search/filter, listing detail, message/contact, photo capture/upload, and listing creation. Candidate mobile navigation is Home, Explore, Sell, Messages, Profile. Candidate desktop navigation is logo, Explore, Favorites, Messages, Sell, Profile. Navigation may be refined without removing required destinations.

Product tone is warm and lightly local. Approved examples include “Nothing tasty here yet,” “Your kitchen is quiet,” and “No conversations yet.” Copy must remain clear about legal/security errors and should not overstate proximity, popularity, verification, or availability.

## Explicit non-goals

The immutable exclusions in `00-PROJECT-MASTER.md` apply. In particular, no cart/order/payment/delivery semantics, paid promotion, business-registration workflow, recommendation intelligence, rich-text editor, push notification, realtime broker, or native application is required. Phone OTP and phone uniqueness enforcement are future capabilities; storing a contact number does not verify it.

## Success criteria for V1

A new user can securely register, become a seller, publish a compliant listing, be discovered by another user through grid/search/map without leaking a home location, communicate, mutually confirm completion, exchange blind reviews, and use report/block controls. An authorized admin can moderate the resulting entities with an audit trail. All behaviors must meet the security, privacy, accessibility, and quality contracts in the numbered specifications and Phase 12 certification.
