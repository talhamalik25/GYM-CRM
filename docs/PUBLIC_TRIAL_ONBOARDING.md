# Public seven-day trial onboarding

## Scope and backward compatibility

Only successful calls to the newly enabled public `/api/auth/register` flow set
`Gym.publicTrial.version = 1`. That immutable marker and the original trial dates
have no default and must never be backfilled. No migration or seed is required.
Existing gyms, accounts, memberships, subscriptions, invoices and admin trial
defaults are not changed by registration. Existing unconfigured legacy gyms keep
their access policy, and Superadmin provisioning remains independent.

Public registration uses the existing `Gym.saasSubscription` and `SaaSPlan`
snapshot, including member/trainer limits. It does not use member subscriptions.
`trialStartedAt` equals the server-side gym `createdAt`; `trialEndsAt` is exactly
604,800,000 milliseconds later. `PlatformSetting.defaultTrialDays` continues to
apply only to existing admin workflows and cannot alter the public seven days.

## Enablement (operator action, not performed by this change)

1. Use a MongoDB replica set with transactions and the existing authentication
   setup (`MONGODB_URI`, `AUTH_SESSION_SECRET`, at least 32 bytes).
2. Create/select an active SaaS plan in Superadmin billing. Set its limits and
   enter manual payment/support instructions in platform billing settings.
3. Set `PUBLIC_TRIAL_PLAN_ID` to that plan's ObjectId and
   `PUBLIC_REGISTRATION_ENABLED=true` in the intended environment.
4. Ensure the unique indexes on `User.email`, `Gym.slug`,
   `PublicTrialClaim.email`, and `PublicTrialClaim.gymSlug` exist. Mongoose's normal
   initialization creates them when autoIndex is enabled. With autoIndex disabled,
   provision indexes through the normal reviewed deployment process first.
   Registration verifies indexes and fails closed if they are missing.

Missing/invalid configuration or a missing/inactive trial plan returns 503 without
creating an account. Disabling the feature stops new registrations without
changing existing public trials. Changing/deactivating a plan does not rewrite
snapshots or trial dates on already-created gyms. No Vercel environment variables
or deployment settings are changed by this implementation.

## Eligibility and transaction safety

The account must use an unused trimmed, lowercase email, and the gym name must
produce an unused URL slug. Slugs use Unicode NFKD normalization, remove combining
marks, lowercase ASCII letters/numbers, collapse punctuation/whitespace to hyphens,
and trim outer hyphens. A name must produce a nonempty slug of at most 80 characters.
There are no random suffixes on collisions. A registered email or gym slug is
ineligible even if the account/gym was created by an administrator.

`PublicTrialClaim` stores unique email and slug claims as eligibility history,
not a subscription. It has no TTL and must not be cascade-deleted when accounts
are deleted or renamed. Claims retain the original identifiers. The claim, user,
gym with embedded trial, owner membership and auth session commit together in one
MongoDB transaction. Unique indexes enforce duplicate/concurrent requests. A
definite abort leaves none of these records; an ambiguous commit response asks
the user to try signing in before retrying, instead of claiming nothing was saved.

This is identifier-based eligibility, not proof of real-world gym/person identity.
Different emails and differently named gyms can evade it; email aliases are not
treated as equivalent. Same-name independent gyms and names without ASCII URL
characters need support/admin provisioning. Existing account holders must use
their current workspace or authorized admin provisioning. There is no new email
verification, CAPTCHA, or distributed registration rate limiter; deployments can
use their existing edge abuse controls. Do not describe this as perfect abuse
prevention. Keep claim retention in the platform's data-retention policy.

## Access and billing

Existing tenant guards check the subscription on each operational API request;
the exact expiry boundary is denied even if cron never runs. Every operational
page also checks the public marker and redirects inactive public owners to
`/billing`; other public gym roles go to `/profile`. Existing gyms are excluded
from this new page policy. Dashboard countdown uses a server timestamp and shows
the exact UTC expiry; server guards remain authoritative.

Owners keep billing/status, account profile/password changes, login and logout
access. Suspended gyms retain the existing read-only billing exception; payment
activation never unsuspends a gym. Trial expiry changes no member data and never
sets `Gym.status` to suspended.

Billing lists active paid SaaS plans, invoices and configured payment instructions.
The owner contacts support for a plan invoice and follows those instructions.
Only authorized Superadmin billing can assign the paid plan, issue/void invoices,
and reconcile an open invoice with a payment reference. Owner payment claims
cannot activate access. Invoice matching and the payment/subscription transaction
remain the activation authority. For public gyms only, a paid term begins at
verification (or the invoice's future start, if later), so delayed verification
cannot activate an already-expired term. Zero-price invoice assignment is rejected
for public gyms. Existing gyms retain their prior free-plan and invoice timing
behavior. Existing authorized admin trial assignment/cancellation remains available
as a deliberate support override; it never reissues the automatic eligibility claim.
Original public trial dates survive those changes and paid activation.

## Cron and analytics

Request-time enforcement requires no cron. The existing authenticated POST
`/api/cron/saas-expiry` with `SAAS_EXPIRY_CRON_SECRET` retains its established scope
and behavior. Do not newly schedule that legacy POST for this feature.

The new GET at the same path is compatible with [Vercel Cron](https://vercel.com/docs/cron-jobs) and uses `CRON_SECRET`
(at least 32 bytes), sent via Vercel's [Bearer authorization header](https://vercel.com/docs/cron-jobs/manage-cron-jobs). Its filter includes `publicTrial.version = 1` and only marks
expired trial/paid subscription statuses. It cannot select existing/admin gyms.
If desired, an operator can add a Vercel cron entry with path
`/api/cron/saas-expiry` and schedule `0 0 * * *` (UTC); no schedule is added here.
Cron is idempotent and leaves gym status/data intact. Existing analytics already
classify trial deadlines at query time, so expired trials are visible before cron.
Superadmin gym details show trial status, start, exact expiry, remaining days
(rounded up), and a link to the existing management workflow.

## Verification

See `tests/INTEGRATION_TESTING.md`. Use only an explicitly disposable
`MONGODB_TEST_URI`, never a production URI. The public registration suite uses
the existing safety helper and a randomly named database. It tests transaction
rollback, concurrency, identity reuse, configuration failure, limits, the exact
expiry boundary, billing/profile access, cross-tenant rejection, authorized
payment restoration, suspension, analytics, and cron idempotency. It compares
existing gym records before/after the entire flow and the new cron, including
legacy records with no SaaS flag, admin trials, paid periods and suspended gyms.

## Verification result (2026-10-23)

- Full `npm test`: 132 passed, 0 failed, 0 skipped.
- Focused public registration MongoDB suite: 14 passed.
- `npm run lint`, `npm run build`, and `git diff --check`: passed.
- All seven integration suites ran against an isolated local replica set on
  loopback port 27187, with a fresh per-suite random test database. The configured
  `.env.test.local` URI failed the existing safety helper; it was not used or
  modified. Process-level test URI overrides selected the disposable instance.
- Build used a local test URI override. No production data, Vercel settings,
  commits, or pushes were used. Existing Mongoose `new` option deprecation
  warnings remain outside this feature scope.

## Changed files

- `.env.example`
- `app/(auth)/register/page.js`
- `app/(dashboard)/attendance/page.js`
- `app/(dashboard)/dashboard/page.js`
- `app/(dashboard)/members/[id]/edit/page.js`
- `app/(dashboard)/members/[id]/page.js`
- `app/(dashboard)/members/new/page.js`
- `app/(dashboard)/members/page.js`
- `app/(dashboard)/memberships/[id]/page.js`
- `app/(dashboard)/memberships/[id]/renew/page.js`
- `app/(dashboard)/memberships/page.js`
- `app/(dashboard)/memberships/plans/[id]/edit/page.js`
- `app/(dashboard)/memberships/plans/new/page.js`
- `app/(dashboard)/payments/page.js`
- `app/(dashboard)/reports/page.js`
- `app/(dashboard)/settings/page.js`
- `app/(dashboard)/staff/page.js`
- `app/(dashboard)/trainer/page.js`
- `app/(dashboard)/trainers/[id]/edit/page.js`
- `app/(dashboard)/trainers/[id]/page.js`
- `app/(dashboard)/trainers/new/page.js`
- `app/(dashboard)/trainers/page.js`
- `app/(dashboard)/workouts/page.js`
- `app/api/admin/billing/route.js`
- `app/api/admin/gyms/[id]/route.js`
- `app/api/auth/logout/route.js`
- `app/api/auth/register/route.js`
- `app/api/cron/saas-expiry/route.js`
- `app/api/gym/billing/route.js`
- `components/admin/admin-gym-details.js`
- `components/auth/register-form.js`
- `components/billing/owner-billing.js`
- `components/billing/trial-countdown.js`
- `docs/PUBLIC_TRIAL_ONBOARDING.md`
- `lib/gymOwnerRegistration.js`
- `lib/ownerPageAccess.js`
- `lib/publicTrialAccess.js`
- `models/Gym.js`
- `models/PublicTrialClaim.js`
- `package.json`
- `tests/INTEGRATION_TESTING.md`
- `tests/adminGyms.test.js`
- `tests/gymOwnerRegistration.integration.test.js`
- `tests/gymOwnerRegistration.test.js`
