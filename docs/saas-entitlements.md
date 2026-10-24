# Fitivo subscription and branch rollout

## Implemented behavior

The existing `Gym.saasSubscription` remains the subscription source of truth. `SaaSPlan` is the editable catalog; subscription and platform-invoice snapshots preserve agreed prices, billing intervals, features, and limits. Editing the catalog does not update active gyms. Existing unkeyed subscriptions keep their former member/trainer limits, reporting access, and single-location behavior. No trial is backfilled.

- **Basic:** proposed PKR 2,999/month; 150 active members, 3 non-owner staff memberships, 1 branch; member, membership, attendance and payment operations; basic dashboard and reports; staff invitations/revocation. Advanced reporting and export APIs are denied.
- **Pro:** proposed PKR 5,999/month; 500 active members, 10 staff, 1 branch; advanced time-series analytics, payment-method analysis, streamed CSV exports, and staff role management.
- **Professional:** proposed PKR 9,999/month; 2,000 active members and 30 staff across 5 active branches; branch creation/editing/deactivation, owner branch selection, branch-scoped operational records/reports, and consolidated reporting. Priority support is an entitlement indicator; this does not implement a helpdesk or promise an SLA.

The launch catalog is deliberately **not written during deployment, startup, or GET requests**. A Superadmin can initialize missing tiers in **Plans & billing → Initialize missing launch plans**, then edit prices, limits and flags. Stable keys are unique; the initializer does not overwrite existing keyed plans. Legacy plans may remain alongside the three new tiers. Branch functionality is forcibly exclusive to `professional`, even if another snapshot contains forged organization flags.

## Enforcement and resource semantics

`lib/entitlements.js` provides `getGymEntitlements`, `hasGymFeature`, `assertGymFeature`, `assertGymLimit`, and downgrade checks. Callers must supply an authenticated organization id; these functions are not authorization by themselves. API authorization resolves a single active `GymMembership`, checks subscription dates, and resolves the authorized branch. Feature errors use `FEATURE_UNAVAILABLE`, expiry uses `SUBSCRIPTION_INACTIVE`, and capacity errors use `LIMIT_EXCEEDED`.

Member/trainer additions and updates run inside a MongoDB transaction. A write to the parent Gym serializes capacity changes before usage is read. Staff enrollment and branch changes use the same lock in their existing transaction. Reconciliation also locks the Gym and rechecks target limits. Mongoose transaction async-local session propagation is enabled for the simple member/trainer handlers. There is no count-then-insert fallback for standalone MongoDB: **a replica set is required**.

Active members means `Member.isActive !== false`, including expired membership terms on enabled member accounts. Staff means active, non-owner Gym memberships; an account disabled at platform level retains its reserved seat until its membership is revoked. Trainer profiles retain the existing independent trainer limit and are not automatically staff login accounts. Pending invitations reserve no seat: acceptance checks the cap atomically. Branch usage counts the main branch plus active additional branches. Inactive branches do not consume an active location slot.

Basic can invite and revoke staff; Pro adds role changes. Professional adds branch assignments. Trainers are restricted to their assigned branch and their existing assigned-member workspace. Trainer profile/email must exist in the invited branch. A trainer cannot be moved to a branch lacking that profile.

## Branch boundary and history

Gym remains the organization security boundary. Branch belongs to Gym. Members, trainers, gym membership plans, member subscriptions, payments, attendance, staff memberships and invitations have optional `branchId` fields.

The main branch id equals its Gym id, in a separate collection. Until migration, records with absent/null `branchId` resolve to that main branch. This is a read-compatibility strategy, not a startup migration. Newly created operational records receive a concrete authorized branch id. A main branch is created transactionally for newly provisioned gyms.

`tenantFilter` combines trusted organization/branch scope with caller filters using `$and`. Aggregate queries also apply the resolved scope. A cookie or `x-fitivo-branch` header is only a selection hint: every request checks ownership and staff assignment. Body/query organization ids never grant access. Only owners can request consolidated scope, and only supported reporting/dashboard GET routes accept it. Mutations and exports require a single branch. Branch switching reloads the page to clear stale client forms and data. Login/logout clear stale branch selections.

Inactive branches are read-only for Professional owners and inaccessible to staff. Downgrading to a single-location plan requires deactivating extra locations and reassigning/revoking active staff assigned there. Historical records remain stored, but those archived locations are unavailable under Basic/Pro; restore Professional to access their branch history. No branch/member/payment/attendance deletion occurs on a plan change. Existing organization-wide unique member phone, trainer email and membership-plan name indexes remain intact; names/identities must therefore remain unique across branches.

## Billing and trials

Owner requests create a `planChangeRequest` on Gym; they do not create paid access. Superadmin reviews and issues a platform invoice. Current subscription terms stay in place while that invoice is open. Only Superadmin reconciliation with an external payment reference activates the invoice snapshot. Reconciliation is transactional and can succeed only once for the currently pending invoice.

A plan change starts a full new term at payment verification, at the invoiced amount, with no automatic proration, refund, or unused-time credit. The UI discloses this before requesting a change. Renewals use the existing subscription snapshot and retain continuity for a still-active paid term. Invoice voiding leaves current access intact. A downgrade is rejected with all exceeded resource counts both at request/issuance and at reconciliation; usage may change while payment is pending.

New public registrations and approved Superadmin gym provisioning receive one seven-day trial of the selected plan. Public registration still requires the existing `PUBLIC_REGISTRATION_ENABLED=true` and `PUBLIC_TRIAL_PLAN_ID` configuration; neither is enabled by this change. With no explicit provisioning plan, the active Basic catalog entry is required. The existing permanent trial-claim collection prevents reuse of email/gym identity; provisioning also checks owner identity. Existing gyms cannot receive a replacement trial through plan assignment. Branch creation never starts a trial. Expired gyms retain owner billing access. Dashboard and billing expose remaining trial days.

## Migration procedure — not applied

The compatibility behavior works without rewriting existing data. Before materializing branch ids:

1. Obtain approval for the target database and Gym. Take a verified backup/snapshot and record its restore procedure and reference.
2. Set `BRANCH_MIGRATION_URI` explicitly. The script never falls back to `MONGODB_URI` and does not auto-load an environment file.
3. Run `node scripts/migrate-default-branches.js --gym=<gym-id>`. This is read-only. Save the JSON report. It lists affected counts, unresolved relationships, and globally unscoped legacy records. Unknown tenant ownership is never guessed or repaired.
4. Resolve any missing/cross-tenant/cross-branch relationships before proceeding. Stop application writes using maintenance mode; the migration flag records operator acknowledgement, not an app-wide maintenance switch.
5. Only after approval, set `BRANCH_MIGRATION_APPROVED=YES`, `BRANCH_MIGRATION_MAINTENANCE=YES`, and `BRANCH_MIGRATION_BACKUP_REFERENCE=<verified-reference>`. Run the same command with `--apply`.
6. Each Gym is migrated atomically and revalidated inside the transaction. A journal records each affected id and whether its field was missing or null. Large legacy datasets may exceed transaction/journal size limits; do not bypass failures—review a batched migration separately.
7. Rerun the read-only report and verify counts, sample member histories, invoices, attendance, staff access, and branch isolation before ending maintenance.

Rollback, with the same approval/backup/maintenance prerequisites, is `node scripts/migrate-default-branches.js --gym=<gym-id> --rollback`. It restores only journaled fields, preserving missing versus null. It fails atomically if any migrated record moved or disappeared. It retains the harmless main Branch record because newer rows may reference it. It never rolls back subscription prices, trial dates, invoices or business content. Use the verified backup restore process if a broader rollback is necessary. Rolling back application code after using additional branches is unsafe without a separate plan, because the previous code does not scope branches.

## Deployment and verification

- Deploy against MongoDB with transaction support. Retain `AUTH_SESSION_SECRET`, existing billing settings and cron configuration.
- Ensure the new Branch and SaaSPlan key indexes exist. If automatic index creation is disabled, review/create these indexes explicitly. Do not run `syncIndexes` or remove existing indexes automatically.
- Initialize the catalog explicitly through the Superadmin UI before provisioning new trial gyms. Set the public trial plan id only if public registration is already approved.
- Tests use only `MONGODB_TEST_URI`, validated by `tests/testDatabaseConfig.js`; each suite creates a distinct `test_<hash>` database. Remote tests additionally require `MONGODB_TEST_DISPOSABLE=YES`. The safety helper is unchanged.
- Added unit tests cover tier rules, snapshots, expiry/error distinctions, branch policy, downgrade counts and CSV injection protection. Added integration coverage exercises actual member/branch/report/billing APIs, concurrent limits, tenant/branch isolation and migration rollback.
- Browser-level visual QA and authenticated integration behavior require a verified disposable database. Unit tests and a successful production build do not substitute for those checks.

## Files

Core modules: `lib/saasPlanRules.js`, `lib/entitlements.js`, `lib/routeEntitlements.js`, `lib/saasBilling.js`, `lib/branchRules.js`, `lib/branches.js`, `lib/branchMigration.js`, `lib/csv.js`; extended `auth`, `tenantContext`, `platformBillingRules`, `paymentLedger`, `saasCapacity`, and `staffInvitations`.

Models: `Branch`, shared `saasSchemas`, `SaaSPlan`, `Gym`, `PlatformInvoice`, and branch fields in `Member`, `Trainer`, `Plan`, `Subscription`, `Payment`, `Attendance`, `GymMembership`, `StaffInvitation`.

APIs: new `/api/branches`, `/api/exports`, `/api/payment-reports`, `/api/gym/entitlements`, `/api/staff/manage`; extended owner/admin billing, provisioning/registration, staff acceptance, and all operational member/trainer/plan/subscription/payment/attendance/report/dashboard scopes.

UI: new plan comparison, branch manager/switcher, entitled reports and `/branches`; extended owner billing/dashboard, shell, staff manager and Superadmin billing/provisioning.

Verification/migration: `tests/saasEntitlements.test.js`, `tests/saasEntitlements.integration.test.js`, updated existing source-contract checks, and `scripts/migrate-default-branches.js`.
