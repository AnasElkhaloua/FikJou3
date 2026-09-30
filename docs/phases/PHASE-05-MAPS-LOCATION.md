# Phase 05 — Maps and Location

Status: Sequential implementation contract

## Objective and prerequisites

Add MapLibre discovery and listing location input while proving private home coordinates cannot enter public responses. Requires Phase 04 query contract and Phase 03 listing editor.

## In scope

- Select/document tile and geocoding providers, attribution, free-tier limits and replacement configuration.
- Implement separate private input/public generalized coordinate storage and versioned generator.
- Add listing location picker with city/area validation and privacy explanation.
- Desktop results/map split view; mobile Show map/full-screen flow; marker price/selection/list synchronization and accessible list fallback.
- Complete EN/FR map controls, privacy explanation, provider/error text and database-selected country/city/area labels; authored listing text remains unchanged.
- Validated bounds (`north/south/east/west`) and explicit “Search this area”; clustering if needed.
- Privacy, provider-failure and representative query-performance tests.

## Out of scope

Exact-address public display, routing/directions, distance guarantees, live tracking, platform delivery, Google paid API dependency and automatic location-based recommendations.

## Database and routes/UI

Migrate private nullable coordinates, public required-on-publish coordinates and generalization version/metadata; add bounds indexes only with plan evidence. Extend listing editor and locale-prefixed Explore map marker endpoint/projection. No endpoint returns both private and public coordinate structures. Map DTOs select EN/FR platform location labels without changing stable location/listing identity.

## Security requirements

Generate public point from area/city centroid plus versioned secret-keyed bounded offset—never from private pin. Select radius bands/minimum privacy threshold before coding and document sparse-area fallback. Restrict private coordinate query/module access, redact logs, keep secrets server-only, strip image GPS, validate bounds/coordinate ranges, and prevent cache audience mixing.

## Tests and verification

Run all gates/migration replay/resource parity. Use sentinel private points and scan public JSON, HTML, metadata, map payload, structured data, snapshots and logs for absence. Test deterministic public generation, radius/centroid fallback, coordinate validity, localized location labels, multiple seller listings, versioning, cross-city rejection, bounds limits, status exclusion, provider outage, keyboard/list access and EN/FR mobile/desktop map flows.

## Acceptance criteria

- [ ] Public/private coordinates are physically and programmatically separated (`03`, `08`).
- [ ] Public points follow documented non-private centroid strategy and pass privacy thresholds (`00`, `08`).
- [ ] No public response/cache/log/image metadata leaks sentinel location (`04`, `08`, `09`).
- [ ] Map/list share filters and bounds behavior is explicit and validated (`08`).
- [ ] Map remains optional enhancement with accessible list and provider failure fallback (`05`, `08`).
- [ ] Provider/attribution/limits/replacement and secret handling are documented (`02`, `08`).
- [ ] Map/location UI and controlled labels are complete in EN and FR while coordinates and authored listing content remain locale-neutral (`01`, `03`, `08`, `10`).
- [ ] Query plans and all quality/security tests pass (`10`).

## Stop conditions

Stop immediately on coordinate/EXIF leakage, derivation from private pin, provider terms incompatible with planned usage, unbounded map queries, or map-only inaccessible discovery.

## Handoff

Report migration, exact generalization algorithm/radius/version (not secret), provider contracts/attribution, endpoint field lists, privacy-test evidence, query plans, screenshots/accessibility checks and rotation/regeneration procedure.
