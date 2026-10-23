# Fitivo UI redesign

The approved scope is visual-only. Keep existing routes, role protection, APIs,
models, form payloads, and data fetching unchanged. Work one stage at a time and
wait for the user's “continue” after each stage.

## Current checkpoint

- Approved Light + Indigo tokens live in `app/tokens.css`, with global styles in
  `app/globals.css`, the Tailwind bridge in `tailwind.config.js`, and Inter
  configured in `app/layout.js`.
- The shared JavaScript components live in `components/ui/`.
- Stages 2–3 are complete: theme foundations and shared components, including
  Dropdown and Toast.
- Stage 4 is complete: a fixed 248px white sidebar, indigo bolt brand, grouped
  role-specific navigation, account card, shared account Dropdown, and mobile
  Drawer below 1024px. Conflicting legacy shell CSS has been consolidated.
- The account card receives the already-authenticated user's email for display
  and its initial. No additional query or authentication change was needed.
- Stage 5 (Gym Owner dashboard) is next, followed by owner modules, auth, admin
  pages, and the final consistency pass.
- Existing legacy module CSS remains until the corresponding module is migrated.
- Stage 4 validation: `npm run lint` and `npm run build` pass. The build required
  network access to fetch the existing Google Inter font.
- An isolated local preview of the real shell passed browser checks at 375px,
  768px, and 1280px for owner, admin, staff, and trainer navigation. Checks covered
  shell overflow, active nested links, modal keyboard containment, Escape,
  backdrop dismissal, focus restoration, resizing to desktop, and sign-out
  failure recovery. Owner/admin screenshots were visually inspected. The preview
  used fallback typography; production Inter was verified by the build.
- These checks do not validate authenticated data flows or the remaining page
  layouts; those still need final responsive and functional acceptance.

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

Rebuild the Gym Owner dashboard using only metrics exposed by existing APIs.
Keep page titles, descriptions, search, and page actions in the shared PageHeader
at the page level; the shell top bar supplies route context and account actions.
Only wire existing search and actions. Do not add a global search or decorative
controls that imply working features. Preserve the approved fixed sidebar width;
desktop collapse is not part of the current design.
