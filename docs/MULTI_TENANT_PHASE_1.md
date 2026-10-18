# Fitivo multi-tenant foundation — Phase 1

## Status

This phase adds tenant identity and authorization primitives only. Existing APIs and records remain single-gym and unscoped. **The application is not safe for multi-tenant launch.** Do not enable public registration or onboard another gym until Phase 2 has migrated every route and query below and verified existing records.

## Current architecture and relationship

- Login uses `User` plus hashed-cookie `AuthSession` records in `lib/auth.js`; current persisted roles are `superadmin` and `staff`.
- `Gym` owns a unique normalized slug, active/suspended status, timezone (default `Asia/Karachi`), and timestamps.
- `GymMembership` is an explicit many-to-many user/gym join with `gym_owner`, `gym_admin`, or `trainer` role and active/revoked status. The unique `(userId, gymId)` index prevents duplicate memberships.
- Legacy user roles are preserved for login compatibility. `platform_super_admin` is accepted by the existing platform account-management guard; the old `superadmin` value remains a compatibility alias because those existing accounts already hold that platform capability. No existing account is promoted or assigned a gym.
- The tenant context resolver trusts only the verified session and stored membership, requires exactly one active membership, checks the gym's active status, and never accepts a browser-selected gym id. Multiple active memberships need a server-validated gym-selection/session mechanism before those accounts can use gym APIs.

## Isolation checklist for Phase 2

Every listed route currently authenticates a user in most cases, but performs gym data reads or writes without an authorized gym scope. This list is not evidence of completed isolation.

| Model / data | Routes and related access | Required tenant scope |
|---|---|---|
| `Member` | `/api/members`, `/api/members/[id]`, `/api/members/[id]/subscriptions`; attendance, payment, subscription and trainer routes that look up members | `gymId` on every lookup, mutation, count, distinct, populate and aggregate; scope related plan/trainer ids to same gym |
| `Plan` | `/api/plans`, `/api/plans/[id]`; member and subscription routes resolving plans | `gymId` on reads/writes; unique plan name becomes unique per gym |
| `Subscription` | `/api/subscriptions`, `/api/subscriptions/[id]`, `/api/subscriptions/[id]/renew`, `/api/subscriptions/[id]/payments` | `gymId` on document and nested flow; verify member, plan, payment and renewal all belong to same gym |
| `Payment` | `/api/payments`, `/api/payments/[id]`, `/api/payments/dues`, `/api/payments/summary`; subscription flows | `gymId` on every read/write/idempotency and aggregate; receipt and idempotency uniqueness reviewed per tenant |
| `Attendance` | `/api/attendance`, `/api/attendance/summary`, `/api/attendance/check-in`, `/api/attendance/[id]/check-out` | `gymId` on list, summary, member resolution, check-in uniqueness and check-out mutation |
| `Trainer` | `/api/trainers`, `/api/trainers/[id]`; member assignment and aggregate counts | `gymId` on all access; email uniqueness and member assignment scoped per gym |
| `Counter` | Payment receipt generation via `lib/generateReceiptNumber.js` | Partition counter by gym before tenant-scoped payment creation |
| `User` / `AuthSession` | `/api/admin/users`, login/logout and session helpers | Platform account administration must require explicit platform role; sessions remain global identity records |

Dashboard and report pages consume the above APIs, so they inherit the same risk. `lib/*Service.js` also includes browser/local mock data paths and must be reviewed when wiring real tenant data. No API currently consumes `resolveTenantContext`.

## Existing data migration plan (not executed)

1. Confirm the single current gym with the data owner and record its name, normalized slug, timezone, and a stable migration identifier. Do not infer ownership from request data or insert a guessed organization.
2. Back up MongoDB and inventory counts for Members, Plans, Subscriptions, Payments, Attendance, Trainers, and Counters. Create the Gym and audited memberships for explicitly approved existing accounts.
3. Add required `gymId` fields and replace global uniqueness constraints with tenant-scoped indexes only after an offline migration rehearsal. Preserve all document ids and historical values.
4. For orphaned or inconsistent records, quarantine/report them for manual ownership resolution; do not silently assign or delete them. Verify counts, references (member/plan/trainer/subscription/payment), duplicate keys, and representative financial/attendance totals before switching reads.
5. Roll out route scope enforcement before allowing any second gym. Keep rollback backup and the old single-gym data accessible until verification and acceptance.

## Phase 2 next step

Prepare and rehearse a reviewed, idempotent migration that assigns the confirmed current gym to existing records and approved users, then convert every query and mutation in the checklist to require the trusted tenant context and same-gym references. Add MongoDB-backed isolation tests against a dedicated test database before enabling another gym.
