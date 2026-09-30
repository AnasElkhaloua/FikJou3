# Phase 02 — Public Shell

Status: Complete — 2026-09-30

## Objective and prerequisites

Build the responsive, accessible application shell, Home presentation structure and shared marketplace UI primitives without implementing seller/listing persistence. Requires Phase 01 complete and authenticated navigation state available.

## In scope

- Responsive header/navigation using candidate destinations, mobile navigation, authenticated/user/admin-aware visibility.
- Complete EN/FR shell resources, locale-aware links and accessible EN/FR switcher that preserves the current logical destination.
- Home page structure with honest empty/data-placeholder boundaries, search entry, categories from database, Explore/Sell paths.
- Reusable listing-card, image, price, rating-empty, badge, form, dialog/drawer, alert, skeleton, empty and error patterns.
- Foundation semantic colors, typography scale, focus, spacing, radius, shadow, touch targets and RTL test fixture.
- Route-level loading/not-found/error behavior and safe auth return paths.

## Out of scope

Persisted listings, fake seeded marketplace listings, seller onboarding, full Explore/search/map, favorites, messaging, reviews, analytics and dark mode.

## Database and routes/UI

No schema migration expected. Read active categories with requested-locale labels for navigation/Home where useful. Implement `/[locale]` shared layouts for EN and FR; locale-prefixed Explore/protected destinations may have honest not-yet-available/empty shells only when needed for navigation, not simulated features. Root `/` remains the Phase 01 locale redirect.

## Security requirements

Navigation visibility never substitutes for route guards. Server renders correct auth/locale state without cache leakage. Components escape user-like text fixtures, use safe locale-aware links and contain no secret/private DTO fields. Return URLs remain allow-listed. Locale switcher never turns arbitrary query/path input into an external redirect.

## Tests and verification

Run standard gates plus translation key/parity checks. Component tests cover EN/FR keyboard/focus/labels/loading/error/disabled behavior and longer French strings. Playwright checks anonymous/auth navigation, route-preserving switching, 320px/mobile/desktop reflow in both locales, keyboard traversal, reduced motion and representative automated accessibility scan. Confirm no fake ratings/popularity/proximity and no hardcoded English product copy.

## Acceptance criteria

- [x] Shell and Home meet light visual direction and responsive contracts (`05`, `06`).
- [x] Listing-card primitive supports real required fields and no invented metrics (`01`, `05`).
- [x] Loading, empty, error, not-found and unauthenticated states are distinct (`06`).
- [x] Keyboard/focus, labels, target sizes, contrast and semantic landmarks pass checks (`05`, `10`).
- [x] Representative Arabic/mixed text and RTL layout do not break reusable components (`05`).
- [x] Every shell/state/accessibility string is complete in EN and FR; the accessible switcher preserves logical destination and safe query state (`00`, `01`, `02`, `05`, `06`).
- [x] Category content and localized labels are database-derived, not hardcoded domain logic (`01`, `03`).
- [x] Protected destinations remain server protected (`04`).
- [x] No Phase 03 marketplace persistence is implemented (`00`, `01`).

## Stop conditions

Stop if shell caching exposes user state, component API requires private data, accessible primitives cannot meet interactions, or product content must be fabricated to appear complete.

## Handoff

Report routes/components/tokens, screenshots or visual checks by viewport, accessibility results, standard gate results, deliberate placeholder states and Phase 03 integration notes.

## Implementation record — 2026-09-30

### Delivered foundation

- Added the responsive locale-aware public shell, Home presentation, honest Explore shell, desktop and mobile navigation, account-aware header actions, footer, and route-level loading, error and not-found states.
- Added reusable search, database-backed category, listing-card, listing-grid, skeleton, empty and error primitives. Future destinations are visibly disabled instead of being exposed as broken links.
- Extended the Phase 00 light-theme tokens without changing their authoritative base values. Normal muted text on the warm background uses a derived readable muted token after automated contrast testing.
- Added localized metadata, self-canonical URLs, reciprocal `en`/`fr`/`x-default` alternates, Open Graph metadata, and `noindex` on incomplete Explore and authentication routes.
- Kept all existing Phase 01 authentication and server-side authorization boundaries. No database schema, migration or Phase 03 persistence was added.

### Database and localization decisions

- Active category identifiers, sort order and requested-locale labels are queried from PostgreSQL. Product navigation does not hardcode category domain data.
- EN and FR resources have exact key parity. Product UI is translated, while seller-authored preview names and listing titles are intentionally unchanged across locales.
- The existing safe locale switcher remains the single route-preserving switch path and retains allow-listed query state on locale-bearing deep routes.

### Development preview policy

- `FIK_MARKETPLACE_PREVIEW` accepts `populated` or `empty`. Development defaults to `populated`; all other environments default to `empty`, and production explicitly rejects `populated`.
- The populated preview is a removable, server-only development fixture. It is never migrated, seeded, written to PostgreSQL or exposed through an API, so it does not implement the out-of-scope fake seeded marketplace.
- Ten authored preview cards exercise varied prices, ratings, review counts, locations, fulfillment modes, mixed Latin/Arabic text and a missing-image fallback. The UI identifies the content as an illustrative development preview, not live listings.
- Three original food-photo strips were generated with the built-in image generator from Moroccan mains, breakfast/cake and pastry/healthy-bowl prompts. CSS crops the strips into nine distinct card images; there are no third-party assets or licensing dependencies.

### Testing and tooling decisions

- Added `@axe-core/playwright` `4.13.0` for representative serious/critical accessibility scanning.
- The Playwright harness starts a real embedded PostgreSQL instance, applies migrations and seed data, then runs populated and empty preview modes as separate Next.js processes. This prevents fixture-mode leakage between tests.
- Playwright uses one worker on Windows because concurrent Next.js development compilers can contend for the same `.next` cache. The harness validates and clears only the workspace `.next` directory before each mode, preventing hangs and orphaned PostgreSQL processes without reducing coverage.
- Screenshot tests wait for completed route content, preserve the native caret and disable the Next.js development badge. Visual QA covers EN/FR desktop, EN/FR mobile, Explore, and populated/empty Home states.
- No Radix or additional shadcn package was required: the Phase 02 interactions are expressed with native semantic links, buttons, forms and landmarks while remaining compatible with the existing shadcn setup.

### Phase 03 handoff

- Replace `loadMarketplacePreview` with public listing DTO queries when Phase 03 authorizes listing persistence. Preserve the listing-card API and map only public DTO fields.
- Activate Sell and listing-detail destinations only after their server authorization, ownership and publication rules exist. The Explore shell remains intentionally non-functional until the later discovery phase.
