# Fitivo Gym CRM — Multi-Tenant Migration Audit

**Phase:** 2B.1, read-only audit and migration design
**Audit date:** 2026-10-18
**Repository branch:** `main`

## Scope and evidence

This is a static audit of the current repository: Mongoose schemas, tenant/authentication utilities, tenant API notes, seed scripts, and declared schema indexes. No MongoDB connection was attempted. The environment has no explicitly configured `MONGODB_AUDIT_URI` or `MONGODB_TEST_URI`, so this report does not claim to have inspected database records, deployed indexes, or Atlas state. The regular application `MONGODB_URI` is not an audit substitute and was not used.

Consequently, all live collection totals, missing-ownership counts, invalid-reference counts, and cross-gym counts are **NOT QUERIED**, not zero. A safe, sanitized, non-production database snapshot and an explicitly configured audit-only connection are prerequisites for those figures.

Existing worktree modifications were present before this audit. They have been preserved. No database records or indexes were changed.

## Current ownership model

- `Gym` represents a tenant, with a globally unique normalized `slug`, status, and timezone. The schema has no owner-user field.
- `User` and `AuthSession` are global identity/authentication records. User-to-gym ownership is represented by `GymMembership` (`userId`, `gymId`, role, active/revoked status), not a field on `User`.
- Tenant resolution trusts a verified session and the user's active membership. The current resolver requires exactly one active gym membership and an active Gym. Client-supplied `gymId` is not trusted as authorization.
- New business documents receive `gymId`; model validation is deliberately conditional on `isNew` for several business models so legacy documents can still be read. That permits pre-existing rows with no tenant owner.
- Seed scripts require a selected existing active `GYM_ID` and refuse to seed while legacy gym-owned model rows lack `gymId`. Seed guards are not a historical ownership mapping and do not establish who owns existing data.
- The repository contains no backfill/migration script. The Phase 1 document states existing Atlas indexes have not been inspected or changed.

No code evidence establishes a trustworthy mapping from every legacy business row to a Gym. Do not assign all legacy rows to the first Gym or infer ownership solely from the original single-gym product assumption.

## Model and collection inventory

Collection names below are the default Mongoose pluralized names; confirm actual collection names in the audit database before querying or migrating.

| Model / collection | Ownership field and schema status | Relationships and ownership evidence | Live totals / missing / invalid |
|---|---|---|---|
| Gym / `gyms` | Tenant identity; no `gymId` field | `slug` is unique in the schema. No owner identity is stored directly; Gym ownership must be established through an approved membership/owner mapping and external business evidence. | NOT QUERIED |
| GymMembership / `gymmemberships` | `gymId` and `userId` required | Joins global User to Gym; unique `{userId,gymId}`. Check missing/orphan User and Gym references, duplicate active memberships, and the one-active-membership resolver constraint. | NOT QUERIED |
| User / `users` | Global identity; no `gymId` | Global unique email. Gym access comes from memberships; do not assign a User to a tenant from email or role alone. | NOT QUERIED |
| AuthSession / `authsessions` | Global session; no `gymId` | References a User and has globally unique token hash. Sessions are not tenant ownership records. | NOT QUERIED |
| Member / `members` | `gymId`; required for new docs, legacy-compatible | References Plan and optional Trainer. Unique `{gymId,phone}` in schema; trainerId also has a standalone index. Plan/trainer references can validate consistency only after their owners are established. | NOT QUERIED |
| Plan / `plans` | `gymId`; required for new docs, legacy-compatible | Member and Subscription reference plans. Unique `{gymId,name}` with case-insensitive collation. | NOT QUERIED |
| Trainer / `trainers` | `gymId`; required for new docs, legacy-compatible | Member may reference Trainer. Unique `{gymId,email}`; additional `{fullName,status}` index. | NOT QUERIED |
| Subscription / `subscriptions` | `gymId`; required for new docs, legacy-compatible | References Member and Plan; renewal history embeds plan and payment references. Indexes include `{memberId,createdAt}` and unique `{gymId,createKey}`. | NOT QUERIED |
| Payment / `payments` | `gymId`; required for new docs, legacy-compatible | References Member, Plan, and optional Subscription. `receiptNumber` is globally unique; idempotency key is unique per Gym when it is a string. | NOT QUERIED |
| Attendance / `attendances` | `gymId`; required for new docs, legacy-compatible | References Member. Unique `{gymId,memberId,date}`. | NOT QUERIED |
| Counter / `counters` | `gymId`; required for new docs, legacy-compatible | Current schema declares globally unique `name` as well as unique `{gymId,name}`. The receipt generator includes the Gym id in new counter names, but the global constraint can still block another use of an identical name. | NOT QUERIED |

`gymId` field presence in a schema does not prove that stored documents have it or that its value references a real Gym. The audit database must count missing/null fields and broken Gym references separately.

## Record ownership classification

Because database documents and an approved source-of-truth ownership map were unavailable, no individual existing record can be marked confidently owned in this audit.

- **CONFIDENTLY MAPPABLE after database audit:** a row with a valid existing `gymId` whose Gym identity is verified against the authorized business mapping, and whose related records pass same-Gym and reference checks. Existing valid memberships may corroborate user access but do not by themselves prove ownership of unrelated legacy rows.
- **AMBIGUOUS:** records with contradictory links, multiple plausible gym mappings, references crossing gym boundaries, or unclear historical ownership. Quarantine for manual review; do not auto-assign.
- **UNASSIGNED:** missing/null `gymId` without trustworthy mapping evidence, invalid `gymId`, or no confirmed Gym/owner mapping. Do not assign based on insertion order, first Gym, current user, or application history alone.
- **ORPHANED:** a referenced Member, Plan, Trainer, Subscription, Payment, User, or Gym does not exist. Treat as a separate remediation class; do not silently fabricate a relationship.

For a row with no `gymId`, a chain of same-owner relationships can be supporting evidence only if the root owner mapping is independently verified. For example, Member → Plan alone cannot establish ownership when both are unassigned. A payment's member/plan/subscription links and an attendance's member link must agree on one verified Gym.

## Relationship checks required

The audit must report counts (never personal data or record contents) for missing, orphaned, and cross-Gym references:

1. GymMembership → User and Gym.
2. AuthSession → User.
3. Member → Gym, Plan, and optional Trainer.
4. Subscription → Gym, Member, Plan, each renewal-history Plan, and each non-null renewal-history Payment.
5. Payment → Gym, Member, Plan, and optional Subscription.
6. Attendance → Gym and Member.
7. Counter → Gym, except a retained legacy counter explicitly classified as unassigned historical state.

Mongoose `ref` declarations do not enforce foreign keys or same-tenant relationships in MongoDB. Current API and ledger paths scope many reads and validate related records, but direct database writers and legacy rows require separate audit checks. No cross-gym or orphan counts were queried in this phase.

## Receipt counter and receipt history

Current receipt generation uses a Gym-specific counter name and includes the full Gym id in new receipt strings. The Phase 1 notes say the old unowned `paymentReceipt` counter is retained but no longer used for new receipts. Keep it as legacy historical state unless evidence establishes a safe mapping; its current sequence does not identify a Gym. Do not reset or redistribute it.

`Payment.receiptNumber` remains globally unique, which is appropriate for preserving old receipt numbers and preventing collisions across tenants. Before cutover, audit duplicate/missing receipt numbers and determine the highest legacy sequence without changing it. Preserve receipt strings and payment `_id` values. Any new sequence allocation must be rehearsed against the actual counter documents and actual unique indexes; do not derive a new Gym counter from an unowned global counter without an approved rule.

## Declared unique indexes and migration conflicts

These are indexes declared by the current source schemas, not a verified inventory of deployed MongoDB indexes. Existing Atlas indexes may differ or may retain pre-migration global constraints.

| Model | Declared unique constraint | Migration concern |
|---|---|---|
| Gym | `{slug:1}` | Global slug uniqueness is intended. Confirm slug selection and actual index. |
| GymMembership | `{userId:1,gymId:1}` | Check duplicate pairs and orphan references before relying on it. |
| User | `{email:1}` | Global identity uniqueness is intended; do not scope it per Gym without a separate identity design. |
| AuthSession | `{tokenHash:1}` | Global session uniqueness is intended. |
| Member | `{gymId:1,phone:1}` | Same phone can be valid in separate gyms only after any old global phone index is safely reconciled. Duplicate phones within one target Gym must be reviewed. |
| Plan | `{gymId:1,name:1}`, case-insensitive | Same plan name can be used by separate gyms; a remaining old global name index can block it. Check case-folded duplicates per Gym. |
| Trainer | `{gymId:1,email:1}` | Same email may be present in multiple gyms; a remaining old global email index can block it. Check duplicates within each Gym. |
| Subscription | `{gymId:1,createKey:1}` | Check duplicate keys within target Gym. The `{memberId,createdAt}` index is not tenant-prefixed. |
| Payment | `{gymId:1,idempotencyKey:1}` partial on string key; `receiptNumber` unique globally | Preserve global receipt uniqueness and history. Check duplicate idempotency keys per Gym, and actual partial-index options. Other payment indexes are not tenant-prefixed. |
| Attendance | `{gymId:1,memberId:1,date:1}` | Check duplicate member/day records per Gym and any old global uniqueness rule. |
| Counter | `{name:1}` via `unique:true`, plus `{gymId:1,name:1}` | The generator currently embeds the full Gym id in new counter names, reducing collision risk for that path. The global unique name remains a schema constraint and can block identical names across Gyms or other writers. Confirm the deployed index and legacy rows before any index plan. |

Do not drop, create, or rebuild indexes in this audit phase. Index changes require a duplicate report, a restored staging rehearsal, an approved ordering, and a rollback plan.

## Safe live audit setup

Before obtaining the missing counts, create a sanitized, consistent, non-production snapshot and configure a dedicated `MONGODB_AUDIT_URI` that targets only that snapshot. Do not point it at production and do not substitute the application's `MONGODB_URI`. Confirm database identity and collection names before running read-only counts/aggregations and read-only index inspection. The audit output should contain collection names and aggregate counts only—no names, phone numbers, emails, credentials, receipts, or connection strings. Capture totals, missing/null `gymId`, invalid Gym refs, missing/orphan refs, cross-Gym relationships, duplicate candidates for each declared/legacy unique key, membership ambiguity counts, legacy counter metadata counts, and actual index definitions/options.

No optional audit script was added because no safe audit database is configured; this avoids introducing an unverified database connection path. No database was contacted.

## Recommended migration dependency order

```text
Confirm Gym identity and authorized owner mapping
                  │
                  ├── Global Users ── GymMemberships (verify user and role)
                  │
                  └── Gym ── Plans ── Members ── Subscriptions ── Payments
                                      │               └── renewal history refs
                                      ├── Trainers
                                      └── Attendance

Legacy receipt counter: preserve separately until its ownership/sequence policy is approved.
```

1. Approve the tenant identity, slug, timezone, legal/business owner, and evidence that maps the legacy business to that Gym. Confirm whether existing Gym and memberships already exist; do not create duplicates.
2. Take a consistent backup/snapshot and verify a restore in isolated staging. Freeze writes for cutover or define and rehearse a reliable change-capture/dual-write boundary.
3. Run the read-only inventory and produce a reviewed mapping manifest. Classify every document as mapped, ambiguous, unassigned, orphaned, or excluded. Resolve or quarantine exceptions before cutover.
4. In a restored staging copy, create/verify Gym identity and user memberships first, then map Plans and Trainers, Members, Subscriptions and embedded renewal references, Payments, Attendance, and finally any counters under an approved receipt policy. Preserve `_id`, payment history, receipt values, and audit-relevant `createdAt`/`updatedAt` timestamps. Never replace ids or synthesize historical events.
5. Reconcile actual indexes only after duplicate analysis. Apply any index transition in the staging rehearsal and verify application compatibility before scheduling production cutover.
6. Require a dry-run preview of per-collection before/after totals, proposed ownership assignments, unresolved records, relationship failures, receipt/counter effects, and index conflicts. Execution must be idempotent, checkpointed, resumable, and record a migration run identifier and counts without storing personal data in logs.
7. After execution, independently verify totals, all ownership references, same-Gym relationships, unique constraints, receipt continuity/uniqueness, and representative tenant API behavior. Keep unresolved rows inaccessible to tenant-scoped APIs until reviewed.

## Backup, rollback, and maintenance window

- Use a timestamped, access-controlled, consistent backup with an independently tested restore. Retain an immutable pre-migration snapshot for the approved retention period.
- Rehearse the complete procedure, including index changes and application reads/writes, against a restored staging copy with representative data volume.
- Schedule a maintenance window with business-owner approval. Quiesce writes or prove a rehearsed change-capture approach so records created during migration are not lost or assigned inconsistently.
- Record source and destination counts, rejected/ambiguous counts, index definitions, migration version/run id, and verification results. Keep logs free of customer personal data and secrets.
- Define rollback before execution. Preferred rollback is restoration of the verified snapshot (or a tested reversible delta strategy) with application cutover reversal. Do not use an ad hoc script to clear `gymId` or reverse index changes without a tested plan.
- Do not cut over while unexplained count differences, cross-Gym links, duplicate conflicts, or unresolved owner mappings remain.

## Blockers and authorization prerequisites

The following currently block a safe write migration:

- No safe audit/staging database was configured, so live record totals, stored ownership, duplicates, cross-Gym references, and deployed indexes remain unknown.
- The authoritative legacy Gym identity and owner-to-Gym evidence have not been confirmed in this audit.
- The exact deployed collection names and index inventory have not been read from the target database.
- Legacy rows without trusted ownership evidence and any orphan/cross-Gym rows need per-record classification and business review.
- The behavior of the deployed global unique indexes must be reconciled with the new tenant-scoped constraints before onboarding multiple gyms.
- No migration manifest, restored staging rehearsal, tested rollback, or maintenance window has been approved.

Before authorizing a write migration, require: (1) an authorized, sanitized non-production snapshot and explicit audit/staging URI; (2) verified backup restore; (3) confirmed Gym identity and owner mapping; (4) complete count/reference/index/duplicate audit; (5) an approved per-record mapping manifest with ambiguous/unassigned rows excluded or explicitly resolved; (6) a staged dry run and idempotency/resume test; (7) approved index and receipt-counter policy; (8) reconciliation acceptance criteria and a tested rollback; and (9) a scheduled, approved write freeze/cutover window. This document authorizes no write operation.
