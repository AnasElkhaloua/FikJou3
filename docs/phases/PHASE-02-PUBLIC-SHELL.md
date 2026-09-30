# Phase 02 — Public Shell

Status: Sequential implementation contract

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

- [ ] Shell and Home meet light visual direction and responsive contracts (`05`, `06`).
- [ ] Listing-card primitive supports real required fields and no invented metrics (`01`, `05`).
- [ ] Loading, empty, error, not-found and unauthenticated states are distinct (`06`).
- [ ] Keyboard/focus, labels, target sizes, contrast and semantic landmarks pass checks (`05`, `10`).
- [ ] Representative Arabic/mixed text and RTL layout do not break reusable components (`05`).
- [ ] Every shell/state/accessibility string is complete in EN and FR; the accessible switcher preserves logical destination and safe query state (`00`, `01`, `02`, `05`, `06`).
- [ ] Category content and localized labels are database-derived, not hardcoded domain logic (`01`, `03`).
- [ ] Protected destinations remain server protected (`04`).
- [ ] No Phase 03 marketplace persistence is implemented (`00`, `01`).

## Stop conditions

Stop if shell caching exposes user state, component API requires private data, accessible primitives cannot meet interactions, or product content must be fabricated to appear complete.

## Handoff

Report routes/components/tokens, screenshots or visual checks by viewport, accessibility results, standard gate results, deliberate placeholder states and Phase 03 integration notes.
