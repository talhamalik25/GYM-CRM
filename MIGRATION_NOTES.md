# Tailwind migration notes

## Baseline

- Source of truth: commit `7b83601d077199d8472524da3a671b7c3b41df85`.
- Original custom CSS: 12,999 lines in seven files. Full inventory and exact values: MIGRATION_PLAN.md.
- Public route baseline: 42 full-page screenshots (14 routes × 375/768/1280 px), with computed styles, in ignored `test-results/tailwind-migration/baseline/`.
- `scripts/tailwind-visual-check.mjs` runs an isolated production server with database connections disabled. It neither signs in nor sends mutations.

## Completed

### Foundation

- Tailwind 4.3.3 was already configured with its PostCSS plugin. No UI or CSS dependencies were added.
- Moved the existing variable declarations into globals.css and translated the existing JavaScript theme bridge to an inline v4 theme. Preserved exact values and added the remaining literal source tokens without rounding.
- Added a small `cn` helper for conditional utility composition.
- Build passed. All 42 public viewport captures have identical recorded computed styles. Forty PNGs match byte-for-byte; two home-page images show only low-level raster differences (maximum channel delta 5/255 at 375 px and 2/255 at 768 px), concentrated in the hero gradient. No geometry or typography differences were found. These are recorded rather than claimed as exact pixel matches.

## Intentionally retained CSS

### Shared UI controls

- Migrated 179 selector groups covering 105 shared UI class hooks into exact-value utilities: buttons, inputs/selects/textareas, fields, cards, badges, avatars, tables, headings, modals/drawers, tabs, dropdowns, notifications, skeletons and chart/stat surfaces.
- Consolidated repeated native control styling in `Control`; reused `Button` for the existing raw button instances. Native DOM tags, props, event handlers, field associations and content are preserved.
- Production build passed. Login, registration and invitation pages match all nine baseline PNGs and recorded computed-style sets at 375/768/1280 px.
- Presentation probes match the original compiled CSS at 375/600/760/768/1280 px. All 32 hover, focus, disabled, ARIA-disabled, invalid-input and selected-tab cases match their original computed styles.
- Kept the existing receipt-print rules and page-specific descendant overrides for their later units.

### Marketing shell

- Migrated announcement, navigation, footer and shared introductory-page styles from their CSS module into utilities; reused a shared `MarketingShellAction` for the repeated link treatment.
- Build passed. Features, pricing and payment match all nine baseline viewport PNGs and their computed styles. The existing homepage gradient raster variation remains separately documented.
- The emptied shell module has no remaining imports and was removed after verification.
- Added an isolated workspace renderer using the actual React components and inert router contexts. Its shell fixture matches the original compiled CSS at all three widths, with no changed pixels or computed styles. These are presentation fixtures, not authenticated production screenshots.
- Mobile navigation opening, Escape dismissal and focus return pass. A repeat of the unchanged features build produced a 1/255 gradient raster variation at 768 px; the comparator now records raw changed pixels and maximum channel delta while allowing at most 5/255 only when all recorded styles and image dimensions match.

### Dashboard shell

- Migrated the shared desktop sidebar, mobile drawer treatment, skip link, top bar, account panel, main column and footer into exact-value Tailwind utilities. The existing navigation, route matching, drawer behavior and logout logic are unchanged.
- Production build passed. The isolated shell fixture has identical computed styles at 375/768/1280 px; 375 and 768 match pixel-for-pixel, while 1280 has 731 low-level raster-only pixel changes with no recorded style difference.

- Root variables, font setup, resets, focus defaults, reduced-motion handling and keyframes remain global.
- Existing component rules remain until their units have been migrated and checked.

### Cascade compatibility

- Existing unlayered CSS outranks normal Tailwind layers, including resets such as `button { font: inherit }`. Migrated utility classes use an identity `exact` variant and a small local PostCSS pass to keep the original unlayered priority without changing the priority of existing Tailwind classes.
- The pass preserves media wrappers and places shorthand declarations before their longhands. It adds no selectors, DOM wrappers or runtime behavior. Inclusive media variants retain the original boundary values.
- Named class hooks temporarily remain where still needed by descendant selectors, state modifiers and receipt print rules; their migrated declarations live in JSX utilities.

## Unresolved

- Authenticated full-page screenshots require database-backed sessions. No authentication changes or fabricated sessions are permitted. Protected screens need isolated presentation checks and source comparison; do not count login redirects as protected-page screenshots.
- Two foundation home-page captures have small raster differences described above.

## Progress counts

- Before: 12,999 lines of custom CSS.
- After: pending completion of the component units; the foundation temporarily increases the token inventory while component rules remain.
