# Fik Jou3? — Design System

Status: Authoritative V1 visual and interaction direction

## Character and principles

The V1 interface is light-only, warm, clean, modern, appetizing and local: Airbnb-like clarity with marketplace browsing density. Food photography supplies most visual color. Coral/tomato signals brand and priority but must not dominate. Avoid glassmorphism, decorative gradients, busy shadows and faux-premium effects.

Design components around real states and keyboard/touch use. A shared primitive should remove inconsistency, not erase context. Use shadcn/ui/Radix where their accessible behavior is useful and style them through project tokens.

## Foundation tokens

| Token      | Value     | Use                                       |
| ---------- | --------- | ----------------------------------------- |
| background | `#F7F7F5` | application canvas                        |
| surface    | `#FFFFFF` | cards, panels, menus                      |
| primary    | `#E94B35` | major CTA, selected state, brand accent   |
| accent     | `#F3A83B` | limited warmth/highlight                  |
| text       | `#1D1D1B` | primary copy                              |
| muted text | `#73736F` | supporting copy after contrast validation |
| border     | `#E7E5E1` | subtle separation                         |

Phase 00 defines semantic tokens for focus, success, warning, danger, info, disabled, overlay and on-color text, validating WCAG contrast. Do not equate brand primary with destructive red. Focus indication must remain visible on every background.

Use a consistent spacing scale based on 4px increments, with 8/12/16/24/32px common layout gaps. Prefer content-driven responsive layouts over dozens of breakpoints. Cards generally use 12–16px radius; controls use a consistent smaller/related radius; pills are reserved for tags/status. Shadows are restrained (one subtle default and one elevated overlay level) and borders retain separation when shadows disappear.

## Typography

Primary Latin UI font for both EN and FR is Geist; fallback `Inter, system-ui, sans-serif`. Future Arabic uses Noto Sans Arabic or an equivalent high-quality UI face. Establish a compact type scale for display, page title, section title, body, small/meta and label. Body copy should remain comfortably readable, with no critical meaning encoded by font weight/color alone.

French is a first-class V1 layout target. Components must accommodate longer French navigation, validation, button, tab, dialog and metadata text through content-driven sizing/wrapping—not truncation or English-specific fixed widths. EN and FR must receive equal responsive, focus and accessibility review. User content supports Unicode and mixed Arabic/French/Darija; set authored content direction safely (for example `dir=auto`) where appropriate.

The language control is compact but fully accessible: visible EN/FR labels, programmatic name, current-state indication beyond color, keyboard/touch usability and at least approximately 44×44px targets where presented as separate controls. Switching locale preserves logical destination and focus behavior.

## Imagery and listing cards

Food images use a consistent aspect ratio in grids, object-cover cropping, meaningful alt text derived from listing context (not filenames), and stable dimensions to prevent layout shift. Galleries preserve ordering and expose thumbnail selection accessibly. Broken/missing media uses a neutral food placeholder without inventing a photo.

Cards show image, title, decimal-formatted price/currency, general area, seller rating only when it exists, and favorite action. The whole-card link and favorite control must not create nested invalid interactions. Use subtle borders and restrained hover/focus elevation. Never fabricate ratings, proximity, urgency, popularity or availability.

## Components and states

Required shared patterns include buttons/links, inputs/textarea/select, checkbox/radio/switch, dialog/drawer, toast/inline alert, tabs, badges, avatar, image/upload manager, listing card/grid, price display, rating display/input, pagination, filter controls, skeletons, empty states, error boundaries, confirmation prompts, and responsive navigation.

Every interactive component defines default, hover (where relevant), focus-visible, active, disabled, loading, validation-error and success feedback. Destructive and moderation actions require unambiguous wording and confirmation proportional to reversibility. Loading controls prevent accidental duplicate submissions but preserve progress and recovery.

## Responsive behavior

Design mobile-first for 320px-class widths upward without horizontal page overflow. Touch targets should be at least approximately 44×44 CSS px. Critical actions remain reachable around the mobile keyboard and safe areas. Photo upload supports camera/library selection and clear per-image progress/error.

Mobile navigation candidates are Home, Explore, Sell, Messages, Profile, with unread indicators that have text alternatives. Filters use a drawer/sheet; map is primarily full-screen behind an explicit “Show map” action. Desktop may use persistent navigation, multi-column grids and results/map split view. Do not merely shrink desktop layouts.

## Accessibility

- Target WCAG 2.2 AA basics: contrast, keyboard access, visible focus, labels, names/roles/states, semantic headings/landmarks and error association.
- Do not use color alone for statuses, pickup/delivery, ratings or validation.
- Modals trap/restore focus; menus and comboboxes follow expected keyboard patterns.
- Announce async save/upload/message results without moving focus unexpectedly.
- Images have useful alt text or empty alt when decorative; icon-only controls have accessible names.
- Respect reduced motion. Motion is brief and functional; no essential information depends on it.
- Map results must also be available as an accessible list; map gestures cannot be the only discovery mechanism.

## RTL readiness

Use logical concepts (`start/end`, inline/block) in CSS/layout and avoid left/right assumptions in reusable components, icons, drawers and spacing. Direction-sensitive icons are mirrored intentionally; universal icons are not. Test representative Arabic strings and `dir=rtl` during component work even before full localization infrastructure exists.

## Content and tone

Use concise, native-sounding EN and FR language rather than literal awkward substitutions. English examples such as “Nothing tasty here yet,” “Your kitchen is quiet,” and “No conversations yet” require reviewed French equivalents in centralized resources. Security, suspension, report and data-loss language stays direct and respectful in both locales. Buttons describe outcomes, not vague submission. Never imply Fik Jou3? handles payment, delivery, guarantees, or seller verification it does not perform.
