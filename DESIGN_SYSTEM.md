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
