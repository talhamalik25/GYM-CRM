# Fitivo multi-tenant foundation — Phase 1

## Status

Application-level tenant scoping is implemented for the existing gym-data APIs. No legacy record was migrated and no database was accessed. Ownership fields are required for new documents but remain optional for persisted legacy documents, so existing records are not invalidated. **The application is not ready for tenant launch or continued legacy operation through these APIs until records and indexes are migrated.** Requests without a verified active gym membership fail closed; ownerless legacy records are not returned.

## Current architecture and relationship

- Login uses `User` plus hashed-cookie `AuthSession` records in `lib/auth.js`; current persisted roles are `superadmin` and `staff`.
- `Gym` owns a unique normalized slug, active/suspended status, timezone (default `Asia/Karachi`), and timestamps.
- `GymMembership` is an explicit many-to-many user/gym join with `gym_owner`, `gym_admin`, or `trainer` role and active/revoked status. The unique `(userId, gymId)` index prevents duplicate memberships.
- Legacy user roles are preserved for login compatibility. `platform_super_admin` is accepted by the existing platform account-management guard; the old `superadmin` value remains a compatibility alias because those existing accounts already hold that platform capability. No existing account is promoted or assigned a gym.
- The tenant context resolver trusts only the verified session and stored membership, requires exactly one active membership, checks the gym's active status, and never accepts a browser-selected gym id. Multiple active memberships need a server-validated gym-selection/session mechanism before those accounts can use gym APIs.
- `requireApiUser` now requires an active `gym_owner` or `gym_admin` membership. Trainer access is deliberately denied until the product defines trainer-to-trainer-record/member assignment rules.
- `tenantFilter` combines the resolved `gymId` with route filters using `$and`, so a request filter cannot override the trusted tenant. Creates stamp the trusted `gymId`; related member, plan, subscription, payment, trainer, and attendance lookups are scoped.
- Seed scripts require `GYM_ID` for an existing active gym, scope operations to that gym, and refuse to run while any gym-owned model contains records with missing `gymId`.

## Isolation checklist for Phase 2

Current API coverage:

| Model / data | Routes and related access | Required tenant scope |
|---|---|---|
| `Member` | `/api/members`, `/api/members/[id]`, `/api/members/[id]/subscriptions`; member lookups in attendance, payments, subscriptions and trainers | Scoped on list/detail/update/count/search and related lookups. New API-created records receive trusted `gymId`. |
| `Plan` | `/api/plans`, `/api/plans/[id]`; member and subscription flows | Scoped on reads/writes and same-gym reference checks. Name uniqueness is now declared per gym. |
| `Subscription` | `/api/subscriptions`, `/api/subscriptions/[id]`, `/api/subscriptions/[id]/renew`, `/api/subscriptions/[id]/payments` | Scoped on reads, updates, retries and writes; member/plan/payment references are checked within the gym. |
| `Payment` | `/api/payments`, `/api/payments/[id]`, `/api/payments/dues`, `/api/payments/summary`; subscription flows | Scoped on reads, idempotency, ledger queries, aggregates, and same-gym references. |
| `Attendance` | `/api/attendance`, `/api/attendance/summary`, `/api/attendance/check-in`, `/api/attendance/[id]/check-out` | Scoped on lists, summaries, member lookups, check-in uniqueness and checkout updates. |
| `Trainer` | `/api/trainers`, `/api/trainers/[id]`; member assignment and counts | Scoped on reads/writes and member assignment counts. Email uniqueness is declared per gym. |
| `Counter` | Receipt number generation through `lib/generateReceiptNumber.js` | Remains a global counter so existing `FIT-####` receipt numbers remain globally unique and unchanged. |
| `User` / `AuthSession` | `/api/admin/users`, login/logout and session helpers | Remain global identity data. Account administration is platform-role gated. |

Dashboard and report pages consume the scoped APIs. Browser/local mock services do not access MongoDB and are not a server-side authorization boundary. Platform user administration and authentication are intentionally global.

## Existing data migration plan (not executed)

1. Confirm the single current gym with the data owner and record its name, normalized slug, timezone, and a stable migration identifier. Do not infer ownership from request data or insert a guessed organization.
2. Back up MongoDB and inventory counts for Members, Plans, Subscriptions, Payments, Attendance, Trainers, and Counters. Create the Gym and audited memberships for explicitly approved existing accounts.
3. Backfill ownership, then require `gymId` for persisted business documents and non-API writers. Replace existing global indexes with tenant-scoped indexes only after an offline migration rehearsal. New compound indexes are declared in schemas; existing Atlas indexes have not been inspected, created, or dropped.
4. For orphaned or inconsistent records, quarantine/report them for manual ownership resolution; do not silently assign or delete them. Verify counts, references (member/plan/trainer/subscription/payment), duplicate keys, and representative financial/attendance totals before switching reads.
5. Verify API-created data and tenant-scoped indexes in a disposable database. Keep a rollback backup and legacy data accessible until verification and acceptance. The current tenant-scoped APIs intentionally cannot see legacy documents with no `gymId`.

## Phase 2 next step

Confirm the current gym identity and approved user membership, then implement and rehearse a reviewed, idempotent migration that assigns ownership to existing records while validating all references. In a disposable MongoDB replica set, verify the migration and compound indexes, then test two-gym API isolation before using production. Do not enable multi-tenant launch before these gates pass.
