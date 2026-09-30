# Fik Jou3? — Pages and Flows

Status: Authoritative V1 route and journey contract

## Route map

Public/indexable routes live below `/[locale]`, where locale is exactly `en` or `fr`: `/[locale]`, `/[locale]/explore`, `/[locale]/listing/[slug]`, `/[locale]/seller/[slug]`, `/[locale]/category/[slug]`. Category pages exist only with active content/value; future city/category paths require an explicit SEO decision. Public pages render useful server content and locale-specific canonical metadata.

Authenticated and non-indexable routes are also locale-prefixed: `/[locale]/favorites`, `/[locale]/messages`, `/[locale]/messages/[conversation]`, `/[locale]/sell`, `/[locale]/sell/new`, `/[locale]/sell/listings`, `/[locale]/sell/listings/[id]/edit`, `/[locale]/profile`, `/[locale]/settings`, `/[locale]/notifications`. Admin routes are `/[locale]/admin`, `/[locale]/admin/users`, `/[locale]/admin/sellers`, `/[locale]/admin/listings`, `/[locale]/admin/reports`, `/[locale]/admin/categories`; all are server-protected and non-indexable.

Root `/` is a locale-negotiation redirect, not a third home URL. Resolution priority is: explicit valid locale segment; valid persisted locale preference; supported browser language; English. Invalid locale segments cannot become resource import paths and must safely redirect to the equivalent English path only when the route can be unambiguously preserved, otherwise return localized not-found; no loop is permitted. Unauthenticated access to a protected route redirects to login within the same locale with an allow-listed relative return target. Unauthorized content returns safe localized not-found/forbidden behavior without leaking records.

The language selector is available without authentication. It replaces `/en` with `/fr` or vice versa while preserving the remaining path, entity slug and safe search/filter query whenever the equivalent localized interface exists. It persists the choice in a locale cookie and, when authenticated, may synchronize `preferredLocale`; URL remains authoritative.

## Page contracts

- **Home:** prominent search, categories, current/nearby/popular sections only when backed by data, listing cards, Explore CTA and non-intrusive Sell CTA. No fabricated content metrics.
- **Explore:** query/search, category, city/area, price, pickup/delivery filters, declared sort, pagination, result count where accurate, listing grid, clear-filter and Show map. URL represents shareable public query state.
- **Listing detail:** ordered gallery, title, price, seller-context rating, area (never precise), pickup/delivery labels, description, seller summary, favorite, platform message and enabled external contact, report. Removed/paused content is unavailable publicly but safely represented to authorized participants/admins.
- **Seller profile:** display identity/image, bio, area, member since, seller rating/count/reviews, active listings and allowed contacts. Never show email/private coordinate/unverified badges.
- **Category:** meaningful active listing results and metadata, with pagination and canonical strategy; empty low-value generated pages are not created for SEO.
- **Favorites:** authenticated saved active listings, graceful unavailable-item handling, remove action.
- **Inbox/thread:** conversation summaries with listing context, counterpart, last-message preview/time and unread state; thread shows retained listing context, ordered messages, blocked/suspended state, completion action and review status when eligible.
- **Seller dashboard:** onboarding or compact summary with Add listing and listing management. No orders/revenue charts. Editor supports draft/save, ordered 1–6 images, title, description, price, category/tags, city/area, pickup/delivery, approximate-location input, validation and lifecycle actions.
- **Profile/settings:** basic user information, seller link/status, contact preferences, privacy/security actions supported by V1. No public user directory.
- **Notifications:** newest-first in-app events, read state and safe destination handling.
- **Admin:** scoped tables/detail panels/actions with reason prompts and audit acknowledgement; not a generic CMS.

## Buyer flow

1. Visitor opens Home/Explore and searches or filters without authentication.
2. They open an active listing and inspect seller/location/reputation.
3. Favorite/message/contact requests authentication where required; after verified sign-in, the original safe destination/action resumes.
4. “Message seller” creates or reuses the unique buyer/seller/listing conversation and shows listing context.
5. Parties arrange all details privately. Either can confirm completion; UI clearly waits for the other confirmation and allows withdrawal before mutual completion.
6. On mutual completion, both receive a 14-day review opportunity. Submission remains blind until counterpart submission or expiry.
7. Buyer may report or block at appropriate surfaces; block disables communication immediately.

## Seller flow

1. Verified user chooses Sell and creates their one seller profile with display identity, area and contact preferences.
2. Seller creates a draft, uploads/reorders/removes 1–6 images, enters required fields and selects approximate general location.
3. Publish validates seller/dependencies, content, image count, fulfillment mode and public location; success opens the public listing.
4. Seller edits, pauses or reactivates owned listing. Removed is terminal; create a new listing to return removed content.
5. Seller receives/replies to listing-linked conversations, confirms completion as appropriate and can review the buyer.
6. Seller manages contact preferences and profile without separate account switching.

## Navigation

Mobile candidate tabs: Home, Explore, Sell, Messages, Profile. Favorites and Notifications remain directly reachable from relevant header/profile affordances. Desktop candidate navigation: Logo/Home, Explore, Favorites, Messages, Sell, Profile, with Notifications accessible. Admin appears only to authorized users but route security never depends on visibility.

Navigation must preserve keyboard focus, current-state indication and accessible labels. Auth status changes update navigation without exposing stale private data.

## UI state requirements

Every data page defines:

- **Loading:** stable skeleton matching final layout; do not show false data or trap interaction indefinitely.
- **Empty:** reason-specific next action (for example, clear filters, explore food, add listing, start a conversation).
- **Error:** plain explanation, safe retry, and correlation/support reference when useful; never expose stack/SQL/provider secrets.
- **Unauthorized/not found:** avoid resource enumeration and offer a safe route away.
- **Offline/transient:** preserve form input where safe and explain retry; avoid duplicate mutation.
- **Success:** confirm durable result and update/revalidate all affected views.

All states, validation messages and accessibility names have complete EN and FR resources. Switching locale does not alter user-generated listing/seller/message/review text. Locale-aware formatting changes presentation of dates, relative times, numbers and MAD prices only.

Forms show field errors next to labelled inputs plus a summary where useful. Unsaved destructive navigation warrants a warning. Upload failures identify the affected image and support retry/removal. Serious moderation/suspension messages are not playful.

## SEO/indexing boundaries

Public active listing/seller/category pages can be indexed in both locales. Every localized public page has a self-referencing canonical plus `hreflang="en"`, `hreflang="fr"` and an `x-default` pointing to the English default URL (or documented root negotiator where search-engine guidance supports it). Explore/filter combinations default to canonical/noindex rules defined in Phase 11. Login, favorites, messages, sell/management, profile, settings, notifications and admin are `noindex` and excluded from sitemaps. Locale-specific sitemap entries share stable locale-neutral entity slugs and declare alternates; localized interface variants are not separate marketplace records.
