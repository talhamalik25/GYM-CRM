# Fitivo UI redesign

The approved scope is visual-only. Keep existing routes, role protection, APIs,
models, form payloads, and data fetching unchanged. Work one stage at a time and
wait for the user's “continue” after each stage.

## Current checkpoint

- Design foundations exist in `app/globals.css`, with the Tailwind bridge in
  `tailwind.config.js` and Inter configured in `app/layout.js`.
- The shared JavaScript components live in `components/ui/`.
- This pass completes missing shared styles and adds Dropdown and Toast.
- App-shell work is partial. Desktop collapse, navigation grouping, and the
  remaining top-bar design belong to the next stage.
- Auth, owner modules, admin pages, and the final consistency pass remain.
- Existing legacy module CSS remains until the corresponding module is migrated.
- Browser checks at 375px, 768px, and 1280px are still required before visual
  acceptance. A passing build alone does not establish visual acceptance.

## Shared component conventions

Use `Button` with `variant`, `size`, `loading`, and `loadingLabel`. Specify
`type="button"` for non-submit buttons inside forms. Disabled links render as
non-interactive text with link semantics.

`Input`, `Select`, and `Textarea` accept `label`, `hint`, and `error`. They connect
the label and messages to the control and retain ordinary input props, names,
values, and event handlers. `SearchBar` accepts controlled `value`, `onChange`,
and optional `onClear`; it does not debounce or fetch.

`Card` supplies the surface. `StatCard` accepts `label`, `value`, `icon`, optional
`description`, and an optional trend object with `label`, `direction`, and `tone`.
Only pass metrics and trends already available from the current data source.

`DataTable` accepts `columns`, `rows`, and `getRowKey`. Columns use `key`, `label`,
and optional `render(row)`. Sorting requires `sortable`, a controlled `sort`, and
`onSortChange`. Pagination takes `{ page, pageSize, total, onPageChange }`.
The component never sorts, slices, or fetches rows. Loading, empty text, and empty
actions are presentation props. Use the existing `Table` where those controls
are not needed.

`Tabs` takes `items`, `value`, `onChange`, and a stable `idPrefix`. Each panel must
have `id="PREFIX-ID-panel"`, `role="tabpanel"`, and
`aria-labelledby="PREFIX-ID-tab"`. Arrow keys, Home, and End move between enabled
tabs. Keep the page's existing content-loading behavior.

`Dropdown` takes a trigger `label` and items with unique `id`, `label`, optional
`href` or `onSelect`, `disabled`, and `danger`. It handles arrow keys, Home, End,
Escape, focus movement, and outside dismissal. Use it only for existing actions.

`Modal` and `Drawer` use native modal dialogs for focus containment, Escape,
background inertness, scroll locking, and focus restoration. `Drawer` supports
`side="left"` or `side="right"`. `ConfirmDialog` starts focus on Cancel and accepts
caller-owned `loading` and `error`; the parent owns mutation and close behavior.

`Toast` takes `title`, optional `description`, `tone`, and `onDismiss`. Wrap a
stack in `ToastRegion`. Messages and dismissal belong to the caller; there is no
new notification API, automatic timeout, or global state. Errors are announced
assertively and other messages politely. Keep dialog-related feedback inside the
dialog so it remains available while background content is inert.

`Avatar` provides initials or a neutral user icon. `Badge` and `StatusPill` supply
semantic status treatments. `PageHeader` supports breadcrumbs and actions.
`EmptyState`, `ErrorState`, `Skeleton`, and `PageSkeleton` supply shared feedback.

## Next stage constraints

Complete the app shell before auth pages. Global search and notifications may
only use existing functionality; if that functionality is unavailable, ask
before adding it. Do not add decorative controls that imply working features.
