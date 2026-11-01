# Fitivo: existing implementation inventory

Audit date: 2026-11-01 (Asia/Karachi). This is the refreshed A1 inventory after the security, structure/config, dashboard/shell and marketing/reports work. It compares current source to AGENTS.md, PRD.md, ARCHITECTURE.md, DESIGN_SYSTEM.md, SECURITY.md and PRODUCT_DETAIL.md. This is not a launch certification. The only application-file change in this audit is removal of the unreferenced `/dev/ui` preview route; no data was changed.

## Status and evidence conventions

- **Working**: the stated limited behavior was exercised in this audit; this does not certify a wider workflow.
- **Partially built**: real implementation exists, but documented requirements are missing or authenticated persistence was not verified.
- **UI only**: presentation, placeholder or local interaction without the promised persisted workflow.
- **Not built**: no implementation found in the inspected source tree.

Authenticated modules and APIs are generally Partially built: source code and mocked checks do not prove production database behavior. A status of Working means only the listed limited behavior was exercised. Current unit run: 215 passed, 4 failed, 8 skipped. The four failures and exact limitations are recorded in ALIGNMENT_REPORT.md. No production credentials, member data or secret values are reproduced.

## Modules against product scope

- Auth / gym onboarding — **Partially built**. Custom opaque database sessions, scrypt, logout revocation, registration gate, platform gym provisioning and invitations exist. Public registration grants seven days immediately; marketing offers an approval-based fourteen-day request. No password-reset page/API (administrative reset script exists).
- Members — **Partially built**. Add/edit/search/detail, plan dates, account activation, trainer assignment, and member create/edit AuditLog writes exist. No memberCode, member photo storage, emergency contact, or explicit frozen/left lifecycle.
- Plans — **Partially built**. Tenant-scoped list/create/update/deactivate and member counts exist. No delete route; owner-only server role checks are present. Authenticated database flow not exercised.
- Membership assignment/renewal — **Partially built**. `Subscription` stores purchased terms and renewal history, idempotency and cancellation. Plan price is derived from the server-side database plan; a client-supplied mismatching agreedPrice is rejected. This is distinct from `GymMembership`, which grants staff tenant access.
- Member payments / receipts / partial dues — **Partially built**. Server receipts, four local methods, installment allocation, transaction/idempotency handling, receivedBy, void metadata and AuditLog create/void entries exist. Void is owner-only and preserves the receipt. Persistence against a live database was not verified.
- Attendance — **Partially built**. Search, check-in/out, date history, summary and expired-member override exist. Owner, staff and trainer attendance permission is implemented; full assignment-specific behavior is not demonstrated by every route test.
- Owner daily summary — **Partially built**. The owner summary API has scoped aggregates for collections, check-ins, expiring members and dues; the UI uses those data states. The dashboard analytics component also requests `/api/reports?dashboard=1`, while the route entitlement uses `basic=1` to select basicReports and otherwise advancedAnalytics. Basic-plan chart access may therefore be denied; no Basic live session was available to verify. No retention list.
- Dues and expiry lists — **Partially built**. Server-computed dues, void-aware totals and expiry views exist; no member WhatsApp action or reminder logging.
- Inactivity/retention and configurable absence threshold — **Not built**. Account `isActive` is not attendance inactivity.
- WhatsApp fee/expiry/inactivity reminders — **Not built**. No member reminder builder, `ReminderLog`, endpoint or persisted click tracking. General support contact links are not member reminders.
- Reports — **Partially built**. Owner-only period analytics include collections by method and new members; CSV export is owner-only. Live totals unverified.
- Roles/staff — **Partially built**. User platform role plus gym membership roles, invitations/revocation and trainer workspace exist. Role matrix differs from documents.
- Audit log — **Partially built**. `AuditLog` model and transactional writes exist for member create/edit and member payment create/void. No owner-facing audit viewer or API was found.
- Marketing — **Partially built** overall. Public informational pages, navigation, pricing outlines, demo tabs and guidance exist. Prices/bank values and previews are explicitly provisional. Contact/trial prepare email drafts; no request persistence or approval queue.
- Public subscription payment — **UI only**. `/payment` selects plan/cycle and previews a screenshot locally; actual submission is disabled. No upload backend.
- Owner/platform SaaS billing — **Partially built**. Database catalog, invoice issuance, reference claims, manual verification, void and expiry processing exist. Screenshot storage is absent; operational price defaults differ from unconfirmed public catalog.
- Marketing chatbot — **UI only**. Client-side public FAQ interaction exists; no `/api/chat`, server knowledge base, LLM or rate-limited endpoint exists.
- Trainer management/workspace — **Partially built**. Profiles and assignments, assigned-member/attendance read view. Already implemented although PRD puts assignment/workspace after MVP.
- Multi-branch — **Partially built**. Branch CRUD-style management, selection, scopes and entitlements exist despite PRD excluding multi-branch from MVP.
- Platform administration — **Partially built**. Overview, gyms, owners, users, billing and subscriptions; not explicitly mapped in draft MVP.
- Gym settings / owner profile — **Partially built**. Name/timezone and owner name/phone edit flows exist; successful database updates unverified.
- Workouts — **UI only**, coming-soon page; explicitly out of current product direction.
- CSV/Excel import, classes, expenses/profit, member portal, Urdu, QR/card check-in, automated WhatsApp/SMS, gateway, native app, diet/AI/POS/equipment/social/store — **Not built**. CSV export exists and is not import. These are deferred/out of scope; their absence is not an MVP defect unless documents explicitly require them.

## Stack, config and environment

Installed: Next 16.4.3, React/React DOM 19.2.8, Mongoose 9.11.2, Tailwind and its PostCSS plugin 4.3.3. `package.json` declares Mongoose `^9.11.2`, Tailwind `^4`, lucide-react `^1.53.0`, Recharts `^3.10.1`; developer tooling includes Playwright, ESLint 9, Next ESLint config and React Compiler. No auth library or TypeScript application source was found. Scripts: dev/build/start/lint/test/test:unit and user create/reset/promote. No new dependencies installed.

`lib/db.js` caches a connection promise and resets failed connections. `next.config.mjs` enables React Compiler, disables X-Powered-By and sets frame denial, nosniff and same-origin referrer headers. HTTPS, backups, live indexes, deployment cron and Atlas cannot be proved from those files.

Application env names: MONGODB_URI, AUTH_SESSION_SECRET, GYM_TIMEZONE, PUBLIC_REGISTRATION_ENABLED, PUBLIC_TRIAL_PLAN_ID, SAAS_EXPIRY_CRON_SECRET, CRON_SECRET, NEXT_PUBLIC_SUPPORT_EMAIL, NEXT_PUBLIC_SUPPORT_WHATSAPP; NODE_ENV controls secure cookies. `.env.example` contains names with blank values; administrative/test names include GYM_ID, BRANCH_MIGRATION_URI, BRANCH_MIGRATION_APPROVED, BRANCH_MIGRATION_MAINTENANCE, BRANCH_MIGRATION_BACKUP_REFERENCE, MONGODB_TEST_URI and MONGODB_TEST_DISPOSABLE. `.env*` is ignored and `.env.example` is tracked. Secret values were not printed. Git-history and deployed-bundle secret scans were not performed.

Public content and commercial defaults live in `config/site.js`, `config/plans.js`, and `config/bank.js`. Bank details are disabled placeholders and public prices are null/unconfirmed. Operational SaaS catalog defaults remain PKR 2999/5999/9999 in config-backed plan rules and initialize the editable database catalog; final amounts still require owner confirmation and do not reprice existing contracts.

## All persisted models

There are 19 persisted Mongoose models. Each entry names its source in `models/`. Schemas were inspected; deployed collection contents/indexes were not.

- `Gym.js`: name, unique slug, timezone, active/suspended, embedded SaaS subscription/plan snapshot, public trial marker, capacity version and plan-change request. Tenant root, not a child requiring its own gymId.
- `User.js`: global identity, fullName/email/phone, hidden passwordHash/authVersion, active flag and platform roles `staff|superadmin|platform_super_admin`. No gymId: tenancy is deliberately in GymMembership.
- `GymMembership.js`: userId/gymId/branchId, `gym_owner|gym_admin|trainer`, active/revoked; unique user+gym. Access membership, not purchased member plan.
- `Member.js`: gymId/branchId, fullName, unique gym+phone, email, gender/DOB, planId/trainerId, dates, notes, isActive/membershipCancelled. No memberCode/photo/emergency contact/frozen/left enum.
- `Plan.js`: gymId/branchId, name, positive whole-rupee price, duration, description, isActive; case-insensitive unique gym+name.
- `Subscription.js`: gymId/branchId/member/plan, dates, original/agreed prices, snapshots, status, creation idempotency and renewalHistory; unique gym+createKey. Implements the draft Membership concept.
- `Payment.js`: gymId/branchId/member/plan/subscription/renewalKey, amountDue/amountPaid, method, paymentDate, unique receiptNumber, receivedBy, voided/voidedAt/voidedBy/voidReason, hidden idempotency/fingerprint, notes. No reference field.
- `Attendance.js`: gymId/branchId/member, date, checkInAt/checkOutAt, overrideExpired; unique gym+member+date. No markedBy.
- `Trainer.js`: gymId/branchId, fullName/email/phone, specialization, joiningDate, status, profileImage URL, notes; unique gym+email.
- `Branch.js`: gymId/name/address/status/isDefault; unique gym+name and partial unique default per gym.
- `Counter.js`: gymId/name/seq; unique name and gym+name; receipt allocation. No timestamps.
- `AuthSession.js`: global userId/tokenHash/authVersion/expiresAt; unique token hash, expiry TTL, timestamps. Seven-day opaque session.
- `AuthRateLimit.js`: global hashed identity/window key, attempts/expiresAt TTL; no timestamps. Login limiter.
- `StaffInvitation.js`: gymId/branchId/email/role, hidden unique tokenHash, pending/accepted/revoked, expiresAt/acceptedBy, timestamps.
- `PublicTrialClaim.js`: immutable email/gymSlug/userId/gymId/claimedAt; unique email and slug, intentionally no TTL. No createdAt/updatedAt.
- `SaaSPlan.js`: global platform catalog key/name/description/price/currency/interval/limits/features/isActive; partial unique key, timestamps.
- `PlatformInvoice.js`: gymId/plan and price snapshot, invoice number/amount/currency/period, status, claims, verified amount/reference/actor, void actor/reason, creator/reconciler, timestamps. This supports platform subscription accountability, not member payment auditing.
- `AuditLog.js`: immutable gymId/actorId/action/resourceId/changedFields/reason/createdAt; indexed by gym and creation time. Actions cover payment create/void and member create/edit.
- `PlatformSetting.js`: global fixed identity `fitivo`, trial defaults and manual payment instructions, timestamps.
- `saasSchemas.js`: shared embedded limits/features/snapshot schemas; **not a collection/model**.

Missing draft models: Membership (implemented as Subscription), ReminderLog, TrialRequest, SubscriptionPayment (platform flow instead uses PlatformInvoice). AuditLog is implemented. Many legacy tenant schemas require gymId only for new documents; existing unowned records require a separately reviewed migration. Subscription/Payment/Trainer have some single-resource/date indexes rather than all recommended gym-prefixed query indexes.

## Components and styling approach

There are 82 JavaScript component files across 18 folders: account (1), admin (5), attendance (1), auth (3), billing (3), branches (2), dashboard (5), layout (1), marketing (16), members (4), memberships (2), payments (3), plans (1), reports (2), settings (1), staff (2), trainers (4), ui (27).

- Shared UI includes Button, Input/Control/Field, Select, Textarea, Card/ChartCard/StatCard, Avatar, Badge/StatusBadge/StatusPill, Table/DataTable, Modal/ConfirmDialog/Drawer, Dropdown, Tabs, Toast, Skeleton, EmptyState/ErrorState, PageHeader/PageHeading and SearchBar. `lib/cn.js` exists. PageHeading delegates to PageHeader; overlapping names are not all independent duplicates. Dedicated Checkbox/Pagination component files are absent; pagination is implemented within resource managers.
- Dashboard shell and resource managers reuse shared UI, with substantial legacy global selectors on owner dashboard, members, plans, payments, attendance, reports and admin screens. Tailwind-heavy membership record, trainers, staff, branches, billing, settings and profile components still inherit shared global styles. Auth/shell/primitives contain long `exact:` utility lists preserving older values. These categories describe source composition, not a measured CSS coverage percentage.
- Marketing composes navigation/announcement/footer, hero/primitives, feature grids, pricing, demo tabs, placeholders, inquiry form and payment preview. The three remaining CSS modules are imported by the pages/components shown below. Home/pricing reuse the home module; most detail pages combine home and pages modules; payment uses pages and payment modules. The old `marketing.module.css` was already deleted in the incoming working tree and no surviving import was found.
- Inter is the loaded font. Marketing CSS also uses system Georgia/Times for accent headings. Light/indigo tokens coexist with extensive arbitrary literal Tailwind values, raw CSS colors and a local PostCSS cascade plugin. Charts use dynamic inline dimensions/colors; static inline values still exist in workouts and the report chart wrapper. Styling was not changed in this audit.
- Loading/empty/error primitives and resource-level handling exist, including dashboard retries and payment/attendance states. Their presence does not prove every interactive/error condition: authenticated failures, focus management, all modal keyboard paths and AA contrast remain untested.

## Route and styling inventory

The generated inventories below enumerate every `page.js` and API `route.js` in this working tree. Route groups do not appear in URLs. CSS amounts are source dependency footprint, not measured rendered/unused CSS: G = global CSS shared by every page; H/P/B = home/pages/payment modules. A shared module's lines must not be summed across routes. JavaScript utility classes and dynamic styles are not included in CSS line totals. Current sources: `globals.css` 9,278 lines, marketing home 1,171, marketing pages 938, marketing payment 456. These shared legacy styles are intentionally not migrated in this audit.

### Every page route (43)

| URL | Status | Implemented purpose / verification boundary | Source | CSS dependency footprint |
|---|---|---|---|---|
| `/login` | Partially built | Sign-in form; HTTP/render checked at 375/768/1280; backend success not implied | `app/(auth)/login/page.js` | G |
| `/register` | Partially built | Gated owner registration; HTTP/render checked at 375/768/1280; backend success not implied | `app/(auth)/register/page.js` | G |
| `/admin/billing` | Partially built | Catalog / invoices / reconciliation; authenticated success not exercised | `app/(dashboard)/admin/billing/page.js` | G |
| `/admin/gyms` | Partially built | Gym list / provisioning; authenticated success not exercised | `app/(dashboard)/admin/gyms/page.js` | G |
| `/admin/gyms/[id]` | Partially built | Gym ownership / status / billing detail; authenticated success not exercised | `app/(dashboard)/admin/gyms/[id]/page.js` | G |
| `/admin` | Partially built | Platform overview; authenticated success not exercised | `app/(dashboard)/admin/page.js` | G |
| `/admin/users` | Partially built | Platform user administration; authenticated success not exercised | `app/(dashboard)/admin/users/page.js` | G |
| `/attendance` | Partially built | Check-in/out and history; authenticated success not exercised | `app/(dashboard)/attendance/page.js` | G |
| `/billing` | Partially built | Owner SaaS invoices / payment reference claims; authenticated success not exercised | `app/(dashboard)/billing/page.js` | G |
| `/branches` | Partially built | Branch management / selection; authenticated success not exercised | `app/(dashboard)/branches/page.js` | G |
| `/dashboard` | Partially built | Owner metrics and attention panels; authenticated success not exercised | `app/(dashboard)/dashboard/page.js` | G |
| `/members/new` | Partially built | Add member; authenticated success not exercised | `app/(dashboard)/members/new/page.js` | G |
| `/members` | Partially built | Directory; authenticated success not exercised | `app/(dashboard)/members/page.js` | G |
| `/members/[id]/edit` | Partially built | Edit member; authenticated success not exercised | `app/(dashboard)/members/[id]/edit/page.js` | G |
| `/members/[id]` | Partially built | Member detail; authenticated success not exercised | `app/(dashboard)/members/[id]/page.js` | G |
| `/memberships` | Partially built | Subscriptions and plan management; authenticated success not exercised | `app/(dashboard)/memberships/page.js` | G |
| `/memberships/plans/new` | Partially built | Redirect to /memberships; authenticated success not exercised | `app/(dashboard)/memberships/plans/new/page.js` | G |
| `/memberships/plans/[id]/edit` | Partially built | Redirect to /memberships; authenticated success not exercised | `app/(dashboard)/memberships/plans/[id]/edit/page.js` | G |
| `/memberships/[id]` | Partially built | Subscription detail / installments / cancel; authenticated success not exercised | `app/(dashboard)/memberships/[id]/page.js` | G |
| `/memberships/[id]/renew` | Partially built | Renew subscription; authenticated success not exercised | `app/(dashboard)/memberships/[id]/renew/page.js` | G |
| `/payments` | Partially built | Receipts / ledger / dues; authenticated success not exercised | `app/(dashboard)/payments/page.js` | G |
| `/profile` | Partially built | Owner profile; authenticated success not exercised | `app/(dashboard)/profile/page.js` | G |
| `/reports` | Partially built | Period analytics / exports; authenticated success not exercised | `app/(dashboard)/reports/page.js` | G |
| `/settings` | Partially built | Gym name / timezone; authenticated success not exercised | `app/(dashboard)/settings/page.js` | G |
| `/staff` | Partially built | Invitations / staff access; authenticated success not exercised | `app/(dashboard)/staff/page.js` | G |
| `/trainer` | Partially built | Assigned-member read workspace; authenticated success not exercised | `app/(dashboard)/trainer/page.js` | G |
| `/trainers/new` | Partially built | Add trainer; authenticated success not exercised | `app/(dashboard)/trainers/new/page.js` | G |
| `/trainers` | Partially built | Trainer directory; authenticated success not exercised | `app/(dashboard)/trainers/page.js` | G |
| `/trainers/[id]/edit` | Partially built | Edit trainer; authenticated success not exercised | `app/(dashboard)/trainers/[id]/edit/page.js` | G |
| `/trainers/[id]` | Partially built | Trainer detail; authenticated success not exercised | `app/(dashboard)/trainers/[id]/page.js` | G |
| `/workouts` | UI only | Coming soon; authenticated success not exercised | `app/(dashboard)/workouts/page.js` | G |
| `/about` | Working | Company information; HTTP/render checked at 375/768/1280; backend success not implied | `app/(marketing)/about/page.js` | G + H + P |
| `/contact` | Partially built | Local email draft; HTTP/render checked at 375/768/1280; backend success not implied | `app/(marketing)/contact/page.js` | G + P |
| `/demo` | UI only | Role tabs / placeholder previews; HTTP/render checked at 375/768/1280; backend success not implied | `app/(marketing)/demo/page.js` | G + H + P |
| `/features` | Working | Module descriptions; HTTP/render checked at 375/768/1280; backend success not implied | `app/(marketing)/features/page.js` | G + H + P |
| `/free-trial` | Partially built | Local fourteen-day trial email draft; HTTP/render checked at 375/768/1280; backend success not implied | `app/(marketing)/free-trial/page.js` | G + P |
| `/guide` | Working | Setup guidance; HTTP/render checked at 375/768/1280; backend success not implied | `app/(marketing)/guide/page.js` | G + P |
| `/` | Working | Marketing home; HTTP/render checked at 375/768/1280; backend success not implied | `app/(marketing)/page.js` | G + H |
| `/payment` | UI only | Quote selection / local screenshot preview; HTTP/render checked at 375/768/1280; backend success not implied | `app/(marketing)/payment/page.js` | G + B + P |
| `/pricing` | Partially built | Provisional quote catalog; HTTP/render checked at 375/768/1280; backend success not implied | `app/(marketing)/pricing/page.js` | G + H + P |
| `/privacy` | UI only | Missing-policy notice; HTTP/render checked at 375/768/1280; backend success not implied | `app/privacy/page.js` | G |
| `/staff/accept` | Partially built | Invitation acceptance; HTTP/render checked at 375/768/1280; backend success not implied | `app/staff/accept/page.js` | G |
| `/terms` | UI only | Missing-terms notice; HTTP/render checked at 375/768/1280; backend success not implied | `app/terms/page.js` | G |

### Every API route (43)

OA = gym_owner or gym_admin; O = gym_owner; T = trainer; S = platform superadmin (both aliases). Protected tenant routes also resolve active membership, gym and authorized branch, and enforce applicable SaaS entitlements. Feature permission is not a substitute for role authorization. Each route has status **Partially built**: handlers exist; full authenticated database behavior was not run. Public exceptions are explicitly marked.

| URL | Status | Exported methods | Purpose | Protected / permitted actor |
|---|---|---|---|---|
| `/api/account/profile` | Partially built | GET, PATCH | Read/update own name and phone | Yes — authenticated global staff identity with owner membership |
| `/api/admin/billing` | Partially built | GET, POST | List billing; initialize/update catalog/settings; assign plans, complimentary grants, renewal invoices, reconcile/reject claims, void/cancel | Yes — S |
| `/api/admin/gym-owners` | Partially built | POST | Assign an owner to a gym | Yes — S |
| `/api/admin/gyms` | Partially built | GET, POST | List/provision gyms | Yes — S |
| `/api/admin/gyms/[id]` | Partially built | GET, PATCH | Inspect/update selected gym status | Yes — S |
| `/api/admin/overview` | Partially built | GET | Platform counts and analytics | Yes — S |
| `/api/admin/users` | Partially built | GET, POST | List/create global staff identities | Yes — S |
| `/api/admin/users/[id]` | Partially built | PATCH | Activate/deactivate global identity | Yes — S |
| `/api/attendance/check-in` | Partially built | POST | Create check-in, optional expired override | Yes — O/A/T (attendance permission) |
| `/api/attendance` | Partially built | GET | Paginated attendance history | Yes — OA |
| `/api/attendance/summary` | Partially built | GET | Today/history check-in summary | Yes — OA |
| `/api/attendance/[id]/check-out` | Partially built | POST | Check out attendance record | Yes — OA |
| `/api/auth/login` | Partially built | POST | Validate credentials and issue session | No session required; origin/input checks and login rate limit |
| `/api/auth/logout` | Partially built | POST | Revoke cookie session, clear cookies | No session required; origin check, revoke supplied cookie if present |
| `/api/auth/register` | Partially built | POST | Create gym/owner and immediate seven-day trial | No session required; origin/input checks, feature gate and shared public rate limit |
| `/api/branches` | Partially built | GET, POST | List branches; select branch or owner manage branch | Yes — O/A/T for read/select; O for manage |
| `/api/cron/saas-expiry` | Partially built | POST, GET | Expire SaaS periods (GET public trials only; POST general) | Yes — secret bearer token; no user session |
| `/api/dashboard/owner` | Partially built | GET | Gym counts and entitlements | Yes — OA |
| `/api/exports` | Partially built | GET | Stream member/payment/attendance CSV | Yes — O |
| `/api/gym/billing` | Partially built | GET, POST | Owner invoices and instructions; submit reference claim / request plan change | Yes — O; GET also permits suspended gym/inactive subscription |
| `/api/gym/entitlements` | Partially built | GET | Read tenant feature/capacity entitlements | Yes — O/A/T; inactive subscription permitted |
| `/api/gym/settings` | Partially built | GET, PATCH | Read/update gym name/timezone | Yes — O |
| `/api/members` | Partially built | GET, POST | Search/list/create members | Yes — OA |
| `/api/members/[id]` | Partially built | GET, PATCH | Read/update member | Yes — OA |
| `/api/members/[id]/subscriptions` | Partially built | GET | List subscriptions for member | Yes — OA |
| `/api/payment-reports` | Partially built | GET | Period collections by method | Yes — O |
| `/api/payments/dues` | Partially built | GET | Compute legacy and subscription balances | Yes — OA |
| `/api/payments` | Partially built | POST, GET | Record/list member payments | Yes — OA |
| `/api/payments/summary` | Partially built | GET | Collection and dues aggregates | Yes — OA |
| `/api/payments/[id]` | Partially built | GET, PATCH | Read receipt; owner-only void with reason and audit | Yes — OA read; O void |
| `/api/plans` | Partially built | GET, POST | List/create membership plans | Yes — O/A read; O create |
| `/api/plans/[id]` | Partially built | GET, PATCH | Read/update/deactivate membership plan | Yes — O/A read; O update |
| `/api/reports` | Partially built | GET | Basic or advanced period analytics | Yes — O |
| `/api/staff/invitations/accept` | Partially built | POST | Accept bearer invitation; existing user must authenticate | Token-protected; no session for new user; matching session for existing user |
| `/api/staff/invitations` | Partially built | GET, POST | List/create invitations | Yes — O |
| `/api/staff/manage` | Partially built | PATCH | Revoke staff/invitations; assign branch or change role | Yes — O |
| `/api/subscriptions` | Partially built | GET, POST | List/create purchased subscriptions | Yes — OA |
| `/api/subscriptions/[id]/payments` | Partially built | POST | Record term installment | Yes — OA |
| `/api/subscriptions/[id]/renew` | Partially built | POST | Append renewal term/payment | Yes — OA |
| `/api/subscriptions/[id]` | Partially built | GET, PATCH | Read/cancel subscription | Yes — OA |
| `/api/trainer/workspace` | Partially built | GET | Read only assigned members and attendance | Yes — T, assigned members only |
| `/api/trainers` | Partially built | GET, POST | Search/list/create trainer | Yes — OA |
| `/api/trainers/[id]` | Partially built | GET, PATCH | Read/update trainer | Yes — OA |

## Current audit verification

Current test/build/lint/pre-launch results and limitations are maintained in `ALIGNMENT_REPORT.md`. Older verification figures in the original A1 report are superseded by the 2026-11-01 results there. The prior public browser screenshots do not certify authenticated screens or production behavior.

`/dev/ui` was deleted after a repo-wide reference scan found no code references. No other debug API route was identified. Seed scripts and fixture tooling were preserved because they are scripts, not routes, and were not shown to be dead code.
