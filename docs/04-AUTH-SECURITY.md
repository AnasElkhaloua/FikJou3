# Fik Jou3? — Authentication and Security

Status: Authoritative V1 security contract

## Authentication

Use Better Auth with email/password, email verification, password reset and secure session management. Follow provider defaults/recommendations for password hashing and token storage; application code never handles plaintext password persistence. Verification/reset tokens are single-use, expiring, secret in transit/logs, and redirect only to allow-listed local destinations. Rotate/invalidate sessions on password reset and sensitive account changes where supported.

Cookies must use `HttpOnly`, `Secure` in production, appropriate `SameSite`, scoped path/domain, and provider-recommended expiry/rotation. State-changing requests use the framework/auth library’s CSRF protection or verified same-origin mechanism; document the exact mechanism in Phase 01. Authentication errors and reset flows must resist email/account enumeration.

Email verification is required before seller publication, messaging, reviews, reports, and external contact reveal. Browsing may remain public. Phone is optional contact data; `phoneVerifiedAt` remains null until a real verification flow exists. Phone OTP and one-phone/account enforcement are out of V1.

Authentication, verification and reset UI and user-facing validation/errors must be complete in EN and FR. Locale-prefixed return URLs are allow-listed only after parsing the locale/path; changing locale must not weaken redirect validation. Locale cookies contain only `en` or `fr`, require appropriate same-site/path settings, and are not authentication or authorization inputs. An authenticated `preferredLocale` may persist presentation preference but never changes access control or content ownership.

## Authorization matrix

| Operation               | Required server-side checks                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Manage seller           | active verified user; `seller.userId == session.userId`; seller not suspended                                         |
| Create listing          | verified user owns active/paused seller; seller policy permits creation                                               |
| Edit/transition listing | load listing and seller; seller owner matches session; legal state transition; active dependencies for publish        |
| Favorite                | verified/active user; target listing is publicly available; unique pair                                               |
| Reveal contact          | verified/active user; active listing/seller; enabled method; not self; no block either direction                      |
| Start conversation      | verified/active buyer; active listing/seller; buyer not seller; messages enabled; no block; reuse unique conversation |
| Read conversation       | authenticated active member; membership loaded from database                                                          |
| Send message            | verified active member; other member/status allow; no block either direction; rate limit                              |
| Confirm completion      | active participant matching buyer/seller; interaction open; confirmation belongs to self                              |
| Submit review           | participant; interaction completed; inside window; reviewee is counterpart; unique reviewer review                    |
| Report                  | verified active user; valid visible/accessible target; not obvious duplicate; rate limit                              |
| Block                   | authenticated active user; target exists; not self; unique/idempotent                                                 |
| Admin action            | authenticated active user; server-verified permission; action allow-list; audit write                                 |

Ownership IDs sent by clients are ignored except as lookup hints. “Not found” is preferred where revealing existence would leak private data.

## Public and private data contracts

Define explicit query projections for listing cards, listing detail, seller public profile, map marker, conversation summary, message, contact reveal, and admin views. Public DTOs may contain generalized area labels/coordinates, display identity, public media and aggregates. They must not contain email, phone, verification tokens, session/account data, private coordinates, internal storage secrets, unpublished moderation details, private messages, or report identities.

Sensitive public reads use allow-list selection at query time. Never fetch a full row and remove fields afterward. Contact phone is returned only by the dedicated authorized action and only for the selected channel. Message/report/admin DTOs are audience-specific and never cached publicly.

## Threat model and controls

- **Broken access control/IDOR:** central session and ownership/member/admin guards; negative cross-user integration tests on every sensitive route.
- **Precise location leakage:** separate columns/types and DTO builders; public queries cannot select private coordinates; response snapshot tests and repository scanning; image EXIF stripping.
- **XSS/content injection:** plain text for all user content, escaped rendering, no user HTML/Markdown in V1, restrictive Content Security Policy where compatible.
- **SQL injection:** parameterized Drizzle queries; no string-concatenated SQL from input; raw SQL requires reviewed parameters.
- **Upload attacks:** inspect actual MIME/signature, allow only documented raster formats, size/dimension/count limits, decode/re-encode or trusted transformation, random keys, filename ignored, EXIF removed, no executable SVG in V1, cleanup on failure.
- **Storage guessing:** opaque high-entropy keys, least-privilege credentials, no provider admin secrets/client exposure, controlled deletion.
- **Spam/brute force:** per-account plus IP/device-aware limits where lawful; cooldowns; uniform auth responses; duplicate constraints; moderation visibility.
- **Enumeration:** opaque IDs, generic auth/reset errors, bounded search, no user directory, consistent forbidden/not-found behavior.
- **CSRF/open redirect:** verified origin/token for mutations; allow-listed relative redirect targets.
- **Locale routing/import abuse:** validate locale against the closed `en | fr` set before loading resources; never interpolate arbitrary path input into filesystem imports; preserve only allow-listed internal paths/query parameters during language switching.
- **Unsafe URLs:** construct WhatsApp/tel links from normalized server data; never accept arbitrary schemes; external links use safe attributes.
- **Contact exposure:** absent from discovery and page source until authorized reveal; log access only with non-sensitive metadata if needed.
- **Suspension/deletion:** session invalidation or denial on every protected request; suspended entities disappear from discovery/contact; history retained only for participants/moderators.
- **Moderation abuse:** least-privilege admin role, reason required, append-only audit, no silent review/rating edits, test admin denial.

## Rate limiting

At minimum protect signup, login, verification resend, password reset request/consume, uploads, listing creation/publish, conversation creation, message send, report creation and review submission. Phase 01 selects auth limits and persistence; feature phases select action limits before exposing endpoints. Limits combine normalized IP with account/target keys where applicable, avoid permanently punishing shared networks, return retry guidance, and emit safe metrics.

Exact values must be documented and tested before production. A reasonable starting decision must consider user harm and free-tier capacity; silent “no limiter” fallback in production is forbidden. Internal database constraints remain the final defense against duplicate actions.

## Security invariants and verification

- Every sensitive mutation tests unauthenticated, wrong-user, suspended, invalid-state and happy paths.
- Every conversation/message query proves membership isolation.
- Every public listing/seller/map response is tested for forbidden fields and exact/private coordinates.
- A block in either direction prevents conversation creation and sends, including existing conversations.
- Notifications, aggregates and audits roll back with failed domain transactions.
- Secrets and personal data are redacted from logs and error monitoring.
- Dependency vulnerabilities are reviewed; critical exploitable findings block release.

Security decisions that depend on deployment (CSP, trusted proxy/IP extraction, cookie domain, retention, limiter backend) must be recorded before production and rechecked in Phase 12.
