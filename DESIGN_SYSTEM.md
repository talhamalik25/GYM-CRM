# Fitivo: Design System

Status: DRAFT v1. Where the existing app already defines a value (fonts, exact radii), **the existing app is the source of truth**; update this file to match it, do not restyle the app to match this file.

## 1. Principles
- Premium SaaS: clean, calm, professional, lots of whitespace
- Information first: owners should scan key numbers in seconds
- Light theme only (decided 2026-10-23: light suits an ERP better)
- Match reference designs closely. Never replace a given reference with an unrelated layout.
- No decorative clutter, no random gradients, no unnatural typography
- Mobile first: the owner uses a phone

## 2. Brand
- Product: Fitivo (by AKTech Digital Solutions)
- Accent: indigo **#4F46E5**
- Logo: use the supplied full wordmark at `public/logo.png`. Icon-only and light wordmark variants have not been supplied; place the dark wordmark on light surfaces.

## 3. Color tokens
| Token | Value | Use |
|---|---|---|
| primary | #4F46E5 | Buttons, links, active nav, focus |
| primary-hover | #4338CA | Hover |
| primary-soft | #EEF2FF | Tinted backgrounds, selected rows |
| bg | #F8FAFC | App background |
| surface | #FFFFFF | Cards, modals |
| border | #E2E8F0 | Dividers, input borders |
| text | #0F172A | Main text |
| text-muted | #64748B | Secondary text |
| success | #16A34A | Paid, active |
| warning | #D97706 | Expiring soon, partial |
| danger | #DC2626 | Due, expired, delete |
| info | #0284C7 | Neutral notices |

Define these once in the Tailwind theme and use the tokens. No raw hex values scattered in components.

## 4. Typography
- Use the font already loaded in the project (verify in layout and globals). Do not add new fonts without approval.
- Scale: page title 24-30px semibold, section title 18-20px semibold, body 14-16px, small 12-13px
- Numbers on dashboards: larger and bolder than labels

## 5. Spacing, radius, shadow
- 4px base scale. Cards: padding 16-24px. Page gutter: 16px mobile, 24-32px desktop.
- Radius: inputs/buttons 8px, cards 12px, modals 16px (match existing if different)
- Shadows: subtle only (one small, one medium). Prefer borders over heavy shadows.

## 6. Components (build once, reuse everywhere)
Button (primary, secondary, ghost, danger; loading and disabled states), Input, Select, Textarea, Checkbox, Badge/StatusPill, Card, StatCard, Table (with empty and loading states), Modal/Dialog, Dropdown, Tabs, Toast, Skeleton, EmptyState, PageHeader, Sidebar, Topbar, Pagination.

Each component must have: hover, focus-visible, active, disabled, loading and error states where relevant.

## 7. Status colors (consistent everywhere)
- Active / Paid: success
- Expiring soon / Partial: warning
- Expired / Due / Overdue: danger
- Frozen / Left: neutral gray

## 8. Layout patterns
- App: left sidebar (collapsible on mobile into a drawer), top bar with gym name and user menu
- Dashboard: top row of stat cards, then "Needs attention" lists (dues, expiring, inactive)
- Lists: search + filters on top, table on desktop, cards on mobile
- Forms: single column on mobile, two columns on wide screens, inline validation messages

## 9. Tailwind rules
- **All new and changed UI uses Tailwind utility classes only. No new custom CSS files.**
- Repeated patterns become components in `components/ui`, not copy-pasted class strings. Use a small `cn()` helper.
- Use theme tokens, not arbitrary values, unless matching an existing exact value.
- Keep `globals.css` limited to resets, font setup, CSS variables and complex keyframes.
- Do not mass-refactor old CSS. The migration is paused until the product is complete.

## 10. Accessibility and responsiveness
- Contrast AA minimum, visible focus rings, labels on all inputs, keyboard-usable menus and dialogs
- Test at 375px, 768px, 1280px
- Tap targets at least 40px on mobile

## 11. Content and tone
- Natural, concise, professional English. No exaggerated or AI-sounding marketing copy.
- Never invent testimonials, user counts, revenue numbers or case studies.
- Empty states should say what to do next.


## 12. Marketing foundation — Phase 1

Public marketing only; authenticated UI and existing hero styling remain unchanged.

- Marketing header: a 36px navy utility bar scrolls away above a sticky white navbar (72px mobile / 76px desktop). Desktop navigation begins at 1280px to avoid tablet collisions. Product uses a six-link disclosure; mobile uses an accordion in a scrollable panel. Escape closes disclosures and returns focus; outside click, focus exit and route selection dismiss them. Existing Fitivo wordmark is shown at 156px.
- MarketingContainer: established 1184px content maximum, 20px mobile gutters, 32px from 640px. Reuse for future sections.
- Palette: slate-900 primary text, slate-500 secondary, white/slate-50 surfaces, slate-200 borders, indigo-600 accent, indigo-700 hover, indigo-50 tint. Tailwind only; no global token changes.
- MarketingShellAction: primary, secondary, tertiary links; 46px minimum height, 10px radius, visible focus, reduced-motion support. Primary CTA uses a restrained shadow and reduced-motion-aware arrow shift. Shared hero/auth buttons unchanged.
- Future typography: existing sans-serif; hero 36–40px mobile / 56–64px desktop, headings 28–32px / 36–44px, body 16–18px with 1.5–1.7 leading. No recurring decorative serif.
- Future spacing: 8/12/16/24/32/48px; section spacing 48–64px mobile / 80–96px desktop.
- Future cards: white, quiet border, 12px radius, minimal shadow. Product imagery: real UI with approved synthetic data, reserved dimensions, optional captions, 16px frame and restrained shadow. Product-frame component deferred.

## 13. Homepage hero

The homepage hero now uses `marketing-hero.js`, with the shared MarketingContainer and MarketingShellAction. Navbar and all later homepage sections retain their existing styling. The centered sans-serif headline uses 42px mobile, 56px tablet and 72px desktop, with solid indigo emphasis. Trial and product-tour links point to `/register` and `/demo`.

The product frame uses `public/hero-attendance.webp`, a literal crop of `attendence.png` (left 290, top 75, width 1565, height 740). Account details, old branding and capture overlays are excluded from the delivered asset. It is explicitly an empty-state preview, pending a clean approved screenshot with synthetic data. Mobile shows a readable left-hand crop; larger screens show the full crop. Next/Image reserves dimensions and prioritizes this single hero image. Hover motion respects reduced-motion preferences; all new styling uses Tailwind.

## 14. Homepage completion

The approved hero and navigation remain unchanged. `marketing-home-sections.js` supplies the capability strip, connected-record workflow, membership/payment story, attendance story and owner visibility. `marketing-home-conversion.js` supplies the three actual team roles, qualified multi-location callout, four-step onboarding, configured pricing preview, seven native-disclosure FAQs and final CTA. `marketing-story.js` shares section spacing, accessible text links and lazy-loaded product crop frames. The footer retains configured identity/contact details, grouped into Product, Resources, Company, Account and Legal.

Homepage pricing reads `PLANS` and `PRICING` without altering billing logic: unconfirmed prices are labeled, the configured Pro recommendation is retained, and plan discussions link to Contact. Homepage trial links use `/register` and seven-day wording. Legacy trial content in `config/site.js`, PRD and other marketing pages still describes a 14-day approval workflow; that pre-existing conflict is outside this homepage pass. The existing branch implementation and Professional entitlements also exceed the draft PRD's single-branch assumption; this page describes only eligible, limited multi-branch access.

New images are literal WebP crops: `home-payments.webp` from `fees.png` (314,90,1535,365), `home-check-in.webp` from `attendence.png` (309,195,1535,185), and `home-report-filters.webp` from `report.png` (309,194,1535,125). No member/account details, capture overlays, stale branding or defective date charts are included. Mobile frames intentionally crop the left side at a readable scale. No synthetic metrics or invented product controls are rendered. Clean populated screenshots remain an optional future asset improvement.

Verification note: the protected navbar still points its seven-day trial links to `/free-trial`, whose current page describes a 14-day approval request. The hero and completed homepage/footer use `/register`. This existing cross-page trial inconsistency was reported rather than changing the approved navbar or registration behavior.

## 15. Reference-matched marketing navbar

The supplied Acadivo screenshot supersedes the earlier header layouts above. The header now has one centered 32px dark announcement strip and a 76px white navigation row (108px total), a 1280px content maximum, a visually 160px Fitivo wordmark, six plain links (Features, Pricing, Product Tour, Guide, About, Contact), compact region control, text login and a 157px by 48px indigo trial CTA with 8px corners. Product/Solutions mega menus and the duplicate announcement strip are no longer rendered. Mobile retains the menu toggle and adds the existing searchable region panel directly to the header; the navigation list uses the same six links.

All header trial links now point to `/register`, resolving the navbar destination conflict recorded above. The hero, homepage sections, registration behavior and locale/preference logic were not changed. The existing preference initialization still causes a hydration mismatch on reload when a non-default country has been saved; this was observed during verification and left unchanged under the explicit country-logic constraint.

Country flags are local SVG assets in `public/flags/` for the existing twelve region options, sourced from https://flagcdn.com/{lowercase-country-code}.svg (Flagpedia flag artwork). They replace platform-dependent emoji rendering without adding a runtime external service or dependency. Search, country options, localStorage preference fields and document language behavior remain unchanged.

## 16. Live-reference editorial homepage

The homepage now adapts the live Acadivo reference's editorial hierarchy and section rhythm while retaining Fitivo's approved headline, navbar, routes and region behavior. `marketing-story.js` provides homepage-specific 34–56px headings, restrained text links and labeled real-product frames. The hero combines the safe attendance capture with a desktop-only payment crop. The body moves through a compact capability strip, problem-to-solution workflow, member and membership stories, dark payments presentation, asymmetric attendance/reporting sections, numbered role rows, qualified multi-location callout, connected onboarding timeline, configured pricing, native FAQs and dark CTA/footer.

Only the existing safe WebP crops are reused; no new dashboard data or product controls are invented. Below-fold images remain lazy-loaded and dimensioned. Mobile uses purposeful crops and stacked layouts; the supporting hero image is hidden below desktop. The shared footer retains configured contact details and legal links. No plan configuration, trial provisioning, region persistence, authentication or tenant business logic changed. The earlier documented saved-region hydration issue remains outside this presentation change.
