# Fik Jou3? — Technical Architecture

Status: Authoritative V1 architecture

## System shape

Use a modular monolith: one repository, one Next.js 16 application, one PostgreSQL database, and provider adapters for external capabilities. Server-render public content where indexing or first-load value matters; use client components only for interaction that requires browser state. Do not introduce distributed systems or a separate backend for appearance.

## Approved stack

- Next.js 16, React 19, strict TypeScript, Tailwind CSS.
- shadcn/ui and Radix primitives where they improve accessible interaction; Lucide React icons.
- PostgreSQL with Drizzle ORM and deterministic migrations.
- Better Auth for email/password, verification, reset and sessions.
- Zod at untrusted boundaries; React Hook Form for sufficiently complex client forms.
- MapLibre GL JS with replaceable OpenStreetMap-compatible tile/geocoding providers.
- `next-intl` for typed EN/FR resources, App Router locale routing, server/client translations and locale-aware formatting/metadata; resources live in the repository.
- Provider-neutral storage interface; Cloudinary free tier is an acceptable adapter.
- Vitest, real PostgreSQL integration tests and Playwright.
- Vercel and Neon free tiers are preferred targets, not permanent dependencies.

Pin exact compatible versions in Phase 00 and document deviations from this stack. Do not install a library whose responsibility is already met by the platform without a recorded need.

## Module boundaries

| Module          | Owns                                                                      | May expose                                                     |
| --------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `auth`          | Better Auth configuration, session lookup, verification/reset integration | authenticated principal, auth actions                          |
| `users`         | marketplace user status/profile basics                                    | safe public/member user views                                  |
| `sellers`       | seller profile, status, contact preferences                               | seller management and public DTOs                              |
| `listings`      | listing lifecycle, images, ownership                                      | management/detail/card DTOs                                    |
| `categories`    | categories and tags                                                       | active discovery taxonomy, admin mutations                     |
| `locations`     | countries/cities/areas, private/public coordinates                        | public location labels/coordinates and private management data |
| `discovery`     | search query, filters, sort, pagination, map bounds                       | listing result DTOs                                            |
| `favorites`     | user/listing saves                                                        | idempotent save/remove and saved page                          |
| `messaging`     | conversations, members, messages, unread state                            | member-authorized inbox/thread operations                      |
| `interactions`  | mutual completion                                                         | completion commands and eligibility facts                      |
| `reviews`       | review submission/publication/aggregates                                  | review lists and contextual reputation                         |
| `notifications` | committed in-app event records                                            | inbox/read operations                                          |
| `moderation`    | reports, blocks, suspension effects                                       | policy decisions and report operations                         |
| `admin`         | admin use cases/audit events                                              | protected administrative operations                            |
| `storage`       | upload validation and provider lifecycle                                  | opaque upload/delete service                                   |
| `i18n`          | supported locales, routing/negotiation, messages and formats              | typed locale/navigation/translation helpers                    |

Modules may read another module through an exported query/use case or shared database transaction deliberately; they must not import UI internals or bypass domain checks. Cross-module operations such as send-message-plus-notification execute in one database transaction when both writes are local.

## Server/client boundaries

- Server components/loaders perform public reads, session-aware page reads, SEO metadata, and DTO mapping.
- Server actions or route handlers accept untrusted input, validate it, resolve session server-side, authorize against loaded records, execute a transaction, and return a typed safe result.
- Client components manage ephemeral UI (dialogs, optimistic favorite state, map interaction, uploads) but never decide ownership, role, completion, review eligibility, contact visibility, or private coordinates.
- Do not send ORM rows to the browser. Each use case returns a purpose-specific DTO with allow-listed fields.
- Cache only data whose audience and invalidation are explicit. Never place session-private, contact, message, or precise-location data in a shared public cache.
- Public pages may use server rendering/revalidation. Private inbox/settings/admin pages are dynamic and non-indexable.

## Request and domain pattern

Use this mutation sequence: parse input → authenticate → load authoritative records → authorize/policy-check → transact state changes and dependent local events → map safe result → invalidate relevant views. Client-supplied user, seller, ownership, aggregate-rating, publication, or admin identifiers never override loaded authority.

Errors use stable categories such as validation, unauthenticated, forbidden, not found, conflict/rate-limited, and internal. Public errors do not reveal whether an unrelated private record exists.

## Internationalization architecture

Use a top-level `[locale]` App Router segment for all public, authenticated and admin UI. Canonical application URLs are `/en/...` and `/fr/...`; entity slugs and IDs are locale-neutral. Root `/` performs one deterministic redirect using a validated preference cookie and `Accept-Language`, with English fallback. Unsupported locale segments never become arbitrary translation import paths and must not loop.

Phase 01 pins a stable Next.js 16-compatible `next-intl` version and establishes:

- `locales = ["en", "fr"] as const`, a `Locale` type and `defaultLocale = "en"` in one module;
- repository-owned namespaced message resources with identical key shape;
- server translation/formatting access and a minimal client provider for interactive components;
- locale-aware navigation helpers and a compact accessible switcher that replaces only the locale segment while preserving path, entity slug and safe query state;
- a locale preference cookie usable without authentication and optional synchronized `preferredLocale` on a user account; explicit URL always wins;
- development/test validation that fails for missing/extra keys or a French page falling back broadly to English;
- locale-aware `Intl` date, relative-time, number and MAD formats plus metadata helpers.

Do not scatter `locale === "fr"` branches or hardcoded product copy in components. Translation modules may emit product copy; user-authored content remains ordinary Unicode data and must never pass through machine translation. Translation resources contain no secrets and require no paid localization service.

## Provider abstractions

- **Storage:** `put`, `delete`, and signed/derived delivery locator as needed; domain stores opaque key plus safe metadata. Upload staging/cleanup is explicit.
- **Email:** verification/reset delivery behind Better Auth-compatible transport. Templates cannot embed open redirects.
- **Maps:** MapLibre rendering is separate from tile style URL and geocoder/search provider. Attribution is mandatory. Public OpenStreetMap services are not assumed to allow unlimited production traffic.
- **Rate limiting:** interface keyed by action plus normalized actor/IP, with an implementation selected in the owning phase. Security must fail safely; a missing production limiter is a release blocker.

Provider-specific IDs/config stay inside adapter/config modules. Domain code works with storage keys, coordinates, messages, and delivery outcomes, not Cloudinary/Vercel/Neon-specific objects.

## Runtime and deployment

Prefer Node-compatible server execution where database/auth/image libraries require it; document any Edge route and prove its dependencies work there. Secrets exist only in server environment variables. Phase 00 defines a validated environment contract with public/server separation and example placeholders under `docs`-approved implementation later—not during specification work.

Production consists of the Next.js deployment, managed PostgreSQL, storage/image provider, and email provider. Build/deploy must run migrations as an explicit controlled step, not concurrently from every app instance. Seed is separate, idempotent for reference data, and never runs automatically against production.

## Observability and failure behavior

Use structured server logs with request correlation where feasible. Never log passwords, session tokens, full messages, email/phone, private coordinates, upload payloads, or reset/verification links. Record actionable provider failures with safe IDs. User-facing operations must distinguish retryable upload/network failure from validation failure.

Local database state is authoritative for marketplace entities. If an image provider operation succeeds but the transaction fails, enqueue/record cleanup or perform bounded compensating deletion. Notifications are created only after/within successful authoritative state change, never before a transaction that may roll back.

## Architectural decision gates

Before coding the relevant feature, document exact package versions; chosen providers; transaction/outbox approach for non-transactional external work; rate-limit persistence; search vector/configuration; pagination method; and public coordinate radius. Choices must preserve the contracts above and free-first operation.
