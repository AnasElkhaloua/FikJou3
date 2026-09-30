# Phase 00 — Foundation

Status: Complete — 2026-09-30

## Objective and prerequisites

Create the minimal Next.js modular-monolith foundation, design tokens, environment contract and quality tooling needed by later phases, without implementing marketplace features. Prerequisites: all authoritative docs approved; Node/package-manager/version choices and supported local PostgreSQL approach recorded.

## In scope

- Initialize one Next.js 16/React 19 strict-TypeScript application and lockfile.
- Establish module-oriented directories and server/client import boundaries from `02-TECHNICAL-ARCHITECTURE.md` without empty architecture theater.
- Configure Tailwind, shadcn/ui/Radix foundations, Geist and tokens from `05-DESIGN-SYSTEM.md`.
- Add baseline responsive shell placeholders only as needed to verify tokens; no product pages/features.
- Configure formatter, ESLint, strict typecheck, Vitest, Playwright harness, PostgreSQL integration-test harness, and production build scripts.
- Define validated server/public environment-variable contract with safe example names/placeholders; configure secret redaction.
- Document stable commands, supported runtime, package policy, provider interfaces/directories, and decision log.

## Out of scope

Database schema/migrations, Better Auth, real routes/features, seed data, providers, discovery, listings, users, marketing content, deployment and Phase 01 work.

## Database and routes/UI

No production database changes or migrations. A test connection harness may prove connectivity without app schema. UI is limited to token/component smoke fixtures or a neutral placeholder; do not build Home/Explore.

## Security requirements

Prevent server-only modules/env from client imports; validate environment at startup/build appropriately; no secret values in example files/logs; establish CSP/security-header decision placeholder for Phase 11 and safe dependency policy. No `.env` secrets committed.

## Tests and verification

Conceptual commands: dependency lock consistency; format check; lint; strict typecheck; unit smoke; PostgreSQL integration harness smoke; Playwright smoke; production build. Confirm client bundle lacks server sentinel/secret names, light tokens meet initial contrast checks, and clean checkout setup is documented.

## Acceptance criteria

- [x] Exact compatible versions and package manager are pinned and justified (`02`).
- [x] One Next.js app builds with strict TypeScript; no marketplace behavior exists (`00`, `02`).
- [x] Token palette/type/spacing/radius/focus foundation matches design spec (`05`).
- [x] Stable commands exist for every quality gate and run successfully (`10`).
- [x] Integration/Playwright harnesses execute a minimal test deterministically (`10`).
- [x] Environment schema separates public/server values and examples contain no secrets (`02`, `04`).
- [x] Module/server-only boundaries and provider interfaces are documented (`02`).
- [x] No database migration or Phase 01 behavior was created (`00`, `03`).

## Stop conditions

Stop if required stack versions are incompatible, secrets would need committing, testing cannot run on supported environments, or satisfying the phase requires implementing a marketplace feature. Amend specs before substituting core stack choices.

## Handoff

Report files/packages created, pinned versions/decisions, command results, environment names (not values), module layout, accessibility/token evidence, known limitations, and explicit confirmation that Phase 01 has not begun.

## Implementation record

### Toolchain decisions

- npm `11.19.1` is the package manager; the supported runtime is Node.js `>=22.12.0 <23` (implemented with `22.15.1`). This satisfies Next.js 16 and Vitest 5 requirements while staying on one Node LTS major.
- Exact direct versions are pinned: Next.js `16.3.7`, React/React DOM `19.3.0`, TypeScript `5.9.3`, Tailwind CSS/PostCSS plugin `4.3.3`, Zod `4.6.5`, Geist `1.7.2`, Vitest `5.0.2`, Vite `8.3.1`, Playwright `1.63.0`, Prettier `3.9.9`, and ESLint `9.39.5` with `eslint-config-next` `16.3.7`.
- ESLint 10 was evaluated but rejected for this phase because Next.js 16.3.7's bundled `eslint-plugin-import`, `eslint-plugin-jsx-a11y`, and `eslint-plugin-react` peer ranges do not accept it. ESLint 9.39.5 is the newest compatible pin despite npm's end-of-support deprecation notice; re-evaluate on a future Next.js/tooling upgrade.
- App Router code lives under `src/app`; shared utilities use `src/lib`; future domain modules and server/provider boundaries are documented under `src/modules` and `src/server` without creating premature feature code.
- Tailwind 4 uses its PostCSS plugin and CSS-first theme configuration. `components.json`, `cn`, class-variance-authority, Lucide, and logical aliases establish a shadcn/ui-compatible base without generating unused components.
- Geist is loaded from the pinned local package rather than downloaded during build. The product remains light-only; source tokens preserve the authoritative palette and map to Tailwind semantic tokens.
- The PostgreSQL harness uses `pg-embedded 0.2.3` with a disposable real PostgreSQL 18 process. It proves the harness without a schema, migration, seed, application database connection, or Docker dependency.

### Environment contract

`NEXT_PUBLIC_APP_NAME` is the only browser-exposed value. `APP_URL` is server-only with a local default and must become the deployed HTTPS origin in production. `DATABASE_URL` is documented but intentionally inactive until Phase 01. `TEST_DATABASE_URL` is optional because Phase 00 uses disposable local PostgreSQL. `.env*` files are ignored except `.env.example`.

### Stable commands

`dev`, `build`, `start`, `lint`, `typecheck`, `format`, `format:check`, `test`, `test:integration`, `test:e2e`, `test:all`, `deps:check`, and `quality` are established. `db:migrate:check` and `db:seed:check` explicitly report not applicable in Phase 00; Phase 01 must replace them with real deterministic migration and seed verification.

### Scope handoff

The only route is a neutral `/` foundation screen used to verify responsive, typography, palette, focus and RTL foundations. No authentication, database schema, migration, seed, seller, listing, discovery, messaging, review, moderation, notification, storage provider, map provider, or marketplace behavior exists. Phase 01 has not started.

### Post-completion multilingual compatibility amendment — 2026-09-30

- Phase 00 now exposes a typed, dependency-free locale contract for the V1 locale set (`en`, `fr`) and English fallback, and the root document language derives from that contract rather than a duplicated literal.
- The neutral Phase 00 `/` screen remains a non-product foundation fixture. Locale-prefixed routing, repository message resources, locale negotiation, switching and the exact compatible `next-intl` pin remain Phase 01 work so this amendment does not start the next phase early.
- The complete Phase 00 quality pipeline was rerun after this minimal compatibility adjustment.
