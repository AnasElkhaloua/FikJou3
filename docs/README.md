# Fik Jou3? — Authoritative Documentation

## Authority

This documentation set is the authoritative implementation specification for Fik Jou3?. Future implementation sessions must use it instead of relying on chat history, assumptions, mockups, or inferred conventions.

English (`en`) and French (`fr`) are complete first-class V1 interface locales. English is the default/fallback. Arabic is not a V1 interface locale, while Unicode user content and future Arabic/RTL readiness remain mandatory.

Precedence, from highest to lowest:

1. `00-PROJECT-MASTER.md`, especially immutable scope and recorded specification decisions.
2. The numbered domain specification responsible for the subject.
3. The active phase file.
4. Implementation notes written during that phase.

When documents conflict, stop before coding, apply the most conservative interpretation of the product principle, and amend the owning specification plus the master decision log. A phase file may narrow sequencing but may not expand V1 scope or weaken a domain invariant.

## Documentation map

| Document                       | Responsibility                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| `00-PROJECT-MASTER.md`         | Vision, immutable boundaries, principles, phase order, completion definition, decisions |
| `01-PRODUCT-SPEC.md`           | Roles, capabilities, functional requirements, product rules and non-goals               |
| `02-TECHNICAL-ARCHITECTURE.md` | Stack, modular boundaries, runtime boundaries, providers and deployment                 |
| `03-DATABASE-SPEC.md`          | Conceptual schema, constraints, indexes, lifecycle and migrations                       |
| `04-AUTH-SECURITY.md`          | Authentication, authorization, threats, abuse controls and public DTO rules             |
| `05-DESIGN-SYSTEM.md`          | Visual language, components, responsive behavior, accessibility and RTL readiness       |
| `06-PAGES-AND-FLOWS.md`        | Routes, page contracts, navigation, journeys and UI states                              |
| `07-MESSAGING-REVIEWS.md`      | Conversations, completion, reviews, publication and ratings                             |
| `08-LOCATION-DISCOVERY.md`     | Geography, privacy-preserving locations, search, filters and maps                       |
| `09-MODERATION-PRIVACY.md`     | Reports, blocks, suspensions, data exposure and auditability                            |
| `10-TESTING-QUALITY.md`        | Test strategy, quality gates and V1 certification                                       |
| `phases/`                      | Sequential implementation contracts for Phases 00–12                                    |

## Phase execution protocol

Phases must be completed sequentially unless an explicit authoritative specification says otherwise. Before starting a phase, read the master, every domain document referenced by that phase, the prior phase handoff, and the phase file. Confirm prerequisites and record any deferred decision required by the phase before implementation begins.

During a phase, stay within its in-scope list, preserve all cross-document invariants, add migrations and tests together with behavior, and do not silently defer failed acceptance criteria. At phase end, execute the specified verification categories, produce the required handoff, and classify every criterion as passed, blocked, or explicitly deferred by an amended specification. The next phase must not start while a required stop condition is present.

Commands in phase files are conceptual until Phase 00 selects package scripts. Phase 00 must map them to stable repository commands; later phases must use those names consistently.

## Change control

- Product-scope changes require an explicit user instruction and synchronized updates to the master, owning domain document, affected phases, and test traceability.
- Small implementation decisions may be recorded without expanding scope. State the invariant, chosen option, alternatives rejected, and affected tests.
- Schema changes require a deterministic migration; never edit already-applied migrations to disguise history.
- Security, privacy, authorization, review integrity, and database constraints may not be relaxed merely to finish a phase or pass tests.
- Provider substitutions are permitted only behind the documented boundary and must preserve behavior.
- No application implementation begins from this documentation task. Phase 00 begins only after explicit instruction.
