# Fitivo UI redesign

The approved scope is visual-only. Keep existing routes, role protection, APIs,
models, form payloads, and existing data contracts unchanged. Work one stage at a time and
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
- Stage 5 is complete: four stat cards, a six-month revenue chart beside expiring
  memberships, and recent payments beside members by plan. Setup guidance and
  existing feature links remain below the main dashboard.
- Stage 6 is underway. The Members directory now uses the shared header, search,
  error, and data-table surfaces while retaining its API filters and load-more
  behavior. Plans now use responsive shared cards and loading/error states while
  retaining create, edit, and activation behavior. Payments is next, followed by
  Attendance.
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

## Stage 5 data and validation

The dashboard only reads existing endpoints; no API, database, auth, or business
rule was changed. Each additional panel owns independent loading, error, and
retry presentation through `components/dashboard/use-dashboard-resource.js`.

- `/api/dashboard/owner`: gym context, existing setup counts, and total active
  member accounts. The total card explicitly labels this scope.
- `/api/reports`: active subscriptions and six ordered calendar months of
  collected member payments. The final supplied month drives the revenue stat
  and solid indigo bar; the earlier months use soft indigo. No growth percentage
  is invented. The old dashboard attendance and membership-status charts are
  replaced by the approved layout; monthly attendance remains available in the
  existing Reports page.
- `/api/attendance/summary`: today's check-ins and currently-inside count, using
  the endpoint's existing date calculation.
- `/api/members?status=expiring&accountStatus=active`: expiring member previews
  and a paginated drawer. The endpoint can return cancelled terms within the
  date window; the display honors its serialized status and excludes those.
  Pagination retains the API's page boundaries, so a page may have fewer visible
  entries. Empty copy distinguishes an empty page from an entirely empty list.
- `/api/payments`: the latest five payments, preserving the existing
  `derivePaymentStatus` Paid / Partial / Pending semantics. Overdue is not
  supplied by this API and is not inferred.
- `/api/plans?includeMemberCounts=true`: authoritative counts for all member
  accounts assigned to each plan. Progress bars use the sum of these counts,
  not the differently scoped active-account count.

All four requested headline metrics are available. Dashboard search is omitted
because there is no existing dashboard search flow. Add member uses `/members/new`.
View all expiring opens a shared Drawer because the existing Members route does
not consume a status query parameter. Existing routes and module filters are
unchanged.

Recharts is the only new direct dependency. The revenue chart has keyboard
support, no animation, and an expandable list of exact monthly amounts.

Validation: the nine existing dashboard/report tests pass, with obsolete UI
expectations updated for the approved layout and shared ErrorState. Lint and the
production build pass. Isolated browser checks at 375/768/1280px cover displayed
API values, bar colors, table overflow containment, expiring drawer pagination and
focus restoration, independent endpoint failures and retries, root retry recovery,
zero-data states, and setup guidance. Fixture responses exist only in the ignored
local preview; no sample records were added to production code or the database.
Screenshots were visually inspected. Live authenticated API integration remains
part of final acceptance.

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

Restyle Payments using the shared components. Members and Plans are complete;
Attendance follows one page at a time.
Keep page titles, descriptions, search, and page actions in the shared PageHeader
at the page level; the shell top bar supplies route context and account actions.
Only wire existing search and actions. Do not add a global search or decorative
controls that imply working features. Preserve the approved fixed sidebar width;
desktop collapse is not part of the current design.
