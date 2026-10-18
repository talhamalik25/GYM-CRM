# Fitivo Phase 3B.0 — Tenant Security Baseline

**Audit date:** 2026-10-18  
**Branch:** `main`  
**Scope:** Read-only source review and non-destructive test commands. No application code, database, or indexes were changed during this audit.

## Executive summary

**Readiness: NOT VERIFIED / BLOCKED for multi-tenant launch.** The source implements a coherent session-backed tenant boundary for the current business APIs: requests must resolve one active membership and active Gym, and business queries use the server-resolved `gymId`. No confirmed cross-tenant API bypass was identified in the routes reviewed. This conclusion is about the source only; it is not proof of runtime isolation.

The live database, persisted legacy `gymId` values, deployed collection names/indexes, actual legacy Gym identity, and owner mapping are unknown. MongoDB integration tests were skipped because no explicit disposable test database was configured. Legacy business documents may have no `gymId`, and Mongoose deliberately permits that on existing documents. **Do not enable multi-tenant customer access or call isolation complete until the staging/data-verification gates in the migration audit pass.**

Public owner registration remains paused. For valid, same-origin registration input, the API validates then returns HTTP 503 without connecting to MongoDB. Invalid input can return 400 and disallowed origins 403 before that pause response; none of those paths writes data.

## Authorization flow and boundary

| Step | Status | Source evidence and assessment |
|---|---|---|
| Login and session issuance | VERIFIED IN SOURCE | [`app/api/auth/login/route.js:11-30`](../app/api/auth/login/route.js) normalizes email, checks active status/password, then calls `createSession`. [`lib/auth.js:14-34,157-166`](../lib/auth.js) creates a random 32-byte token, stores an HMAC-SHA256 hash, and sets an HttpOnly, SameSite=Strict cookie; production also sets Secure and uses the `__Host-` cookie name. |
| Session validation/expiry | VERIFIED IN SOURCE | [`lib/auth.js:17-24,72-86`](../lib/auth.js) rejects malformed tokens, hashes with a required 32-byte secret, checks stored `expiresAt > now`, and reloads an active User. Session TTL is seven days; the model also declares a TTL index, but deployed TTL behavior is NOT VERIFIED. |
| Logout | VERIFIED IN SOURCE | [`app/api/auth/logout/route.js:4-19`](../app/api/auth/logout/route.js) checks Origin when supplied, deletes the presented session hash, and clears the cookie. It is idempotent for a missing cookie. |
| Gym resolution | VERIFIED IN SOURCE | [`lib/tenantContext.js:16-34`](../lib/tenantContext.js) obtains the authenticated user, loads active memberships, requires exactly one, loads that Gym, and authorizes the membership. No request parameter selects a tenant. Multiple active memberships fail closed with 403. |
| Membership/role enforcement | VERIFIED IN SOURCE | [`lib/tenantAuthorization.js:3-21`](../lib/tenantAuthorization.js) verifies membership user id, active status, allowed role, and active matching Gym. Standard tenant APIs allow `gym_owner` and `gym_admin`; staff invitation management narrows this to `gym_owner`. |
| Tenant query construction | VERIFIED IN SOURCE | [`lib/tenantQuery.js:1-4`](../lib/tenantQuery.js) combines the trusted tenant id and route filter using `$and`, preventing a caller filter from overriding `gymId`. `getRequestGymId` throws without context ([`lib/auth.js:114-125`](../lib/auth.js)). |
| Platform superadmin | VERIFIED IN SOURCE | [`lib/auth.js:127-150`](../lib/auth.js) uses a separate `requireSuperadminUser`; [`lib/adminUserRules.js:5-7`](../lib/adminUserRules.js) accepts the existing `superadmin` and `platform_super_admin` values. Platform user listing is global by design and restricted to that guard ([`app/api/admin/users/route.js:18-49`](../app/api/admin/users/route.js)). Superadmins do not thereby receive a gym context. |
| Public owner registration | TESTED | [`app/api/auth/register/route.js:11-25`](../app/api/auth/register/route.js) validates origin/body and returns 503 for valid input. It imports no DB model/connector and contains no create/write operation. The page shows a pause notice ([`app/(auth)/register/page.js:1-13`](../app/(auth)/register/page.js)). Tests cover paused valid input, invalid/forged input, and Origin rejection. |

`originError` permits requests with no `Origin` header; when a header exists it must match the request URL's origin. Cookie SameSite=Strict and Origin validation offer useful CSRF protection, but deployment proxy/host/origin configuration has not been reviewed.

## API route security matrix

For all routes in the tenant rows below, the common policy is: **authenticated active session + exactly one active GymMembership + active Gym + role `gym_owner` or `gym_admin`**. The Gym id comes from the server-side context. No business route exposes DELETE or an unscoped bulk-write handler. Findings below are static source findings; runtime requests against two gyms were not executed because Mongo integration tests were unavailable.

| API route(s) | Auth / role | Tenant scope and reference checks | Result |
|---|---|---|---|
| `GET/POST /api/members` | Common tenant policy | List/count/search and Plan/Trainer references use `tenantFilter`; POST stamps context `gymId`. | VERIFIED IN SOURCE; runtime NOT VERIFIED |
| `GET/PATCH /api/members/[id]` | Common tenant policy | ID reads/current row/update are tenant-filtered; Plan and Trainer assignment and populated details are tenant-scoped. `gymId` is removed from update payload. Foreign ids return generic 404. | VERIFIED IN SOURCE |
| `GET /api/members/[id]/subscriptions` | Common tenant policy | First validates tenant-owned Member, then scopes Subscription, Plan and Payment reads to tenant. | VERIFIED IN SOURCE |
| `GET/POST /api/plans`; `GET/PATCH /api/plans/[id]` | Common tenant policy | Queries and ID updates use tenant filter; create stamps context id; update strips `gymId`. | VERIFIED IN SOURCE |
| `GET/POST /api/trainers`; `GET/PATCH /api/trainers/[id]` | Common tenant policy | Reads, counts, distinct values, update and member assignments are tenant-scoped; aggregation starts with context `gymId`; create stamps context. | VERIFIED IN SOURCE |
| `GET/POST /api/subscriptions`; `GET/PATCH /api/subscriptions/[id]` | Common tenant policy | List/detail/cancel and serialization lookups scope Subscription, Member, Plan and Payment. POST transaction uses context `gymId` for idempotency and Member/Plan checks, then writes Subscription/Payment under that id. | VERIFIED IN SOURCE |
| `POST /api/subscriptions/[id]/renew`; `POST /api/subscriptions/[id]/payments` | Common tenant policy | Transaction lookups/updates carry `_id` and context `gymId`; payment ledger verifies subscription, member, plan and payments in the same Gym. Optimistic version locking and idempotency keys guard concurrent financial updates. | VERIFIED IN SOURCE |
| `GET/POST /api/payments`; `GET /api/payments/[id]` | Common tenant policy | Payment create/list/retry use context tenant; Member/Plan references and populated records match the same tenant. ID lookup is tenant-filtered. | VERIFIED IN SOURCE |
| `GET /api/payments/dues`; `GET /api/payments/summary` | Common tenant policy | Aggregations begin with a context-gym `$match`; lookup pipelines also match both relationship id and `gymId`. Subscription/Payment/Member lookups are tenant-scoped. | VERIFIED IN SOURCE |
| `GET /api/attendance`; `POST /api/attendance/check-in`; `POST /api/attendance/[id]/check-out`; `GET /api/attendance/summary` | Common tenant policy | Attendance, Member, nested Plan, uniqueness checks and checkout updates are tenant-scoped. Summary aggregation starts with context `gymId`; create stamps that id. | VERIFIED IN SOURCE |
| `GET/POST /api/staff/invitations` | Authenticated `gym_owner` membership only | Staff and invitation queries/updates use context Gym id. Role allowlist rejects owner assignment; client Gym id is not used. Development-only token URL is not returned in production. | VERIFIED IN SOURCE; DB behavior NOT VERIFIED |
| `POST /api/staff/invitations/accept` | Invitation bearer token; existing accounts must also authenticate as invited User | Token hash, pending status and expiry are checked; stored invitation fixes Gym and role. A conditional claim and membership/user/session creation share a transaction; no client Gym/role is accepted. | VERIFIED IN SOURCE; race behavior NOT VERIFIED |
| `GET/POST /api/admin/users` | Platform superadmin only | Global User operations by design; only creates platform role `staff`, never accepts a caller role or gym id. Response omits password hash. | VERIFIED IN SOURCE |
| `POST /api/auth/login`, `POST /api/auth/logout` | Public login / session-specific logout | Global identity/session operations; not tenant data APIs. | VERIFIED IN SOURCE; database compatibility NOT VERIFIED |
| `POST /api/auth/register` | Public endpoint paused | Valid request returns 503 before DB access; malformed requests return 400, Origin mismatch 403. No alternate unauthenticated owner-creation API was found. Invitation redemption is token-bound and does not create an owner role. | TESTED |

### Query and response observations

- Member, plan, trainer, subscription, payment and attendance foreign ids are checked inside the active Gym before writes. ID-based read/update filters bind both the object id and tenant id.
- Nested payment aggregation lookups match the current Gym as well as relation ids. Attendance and trainer aggregates also start with the current Gym.
- Cross-tenant object lookups generally produce the same not-found message as nonexistent ids; this avoids confirming another tenant's record existence. Responses include only selected fields for related objects. Errors are mostly generic; a few server logs include sanitized error messages, but not request bodies or credentials in the inspected handlers.
- No application API writes a caller-selected `gymId`; create handlers stamp the server-resolved id. Some bodies reject a supplied `gymId`; others validate/strip unknown or immutable fields. Query filters are always joined to the trusted tenant via `$and`.
- `scripts/seed-*.js` are manual utilities, not API routes. [`scripts/seedTenant.js`](../scripts/seedTenant.js) requires explicit `GYM_ID`, checks an active Gym, and refuses seeding while modeled legacy records lack `gymId`. CLI account scripts are separate administrative paths and must remain operationally restricted.

## Model and declared-index inventory

**Schema declarations only. Actual Atlas indexes and data validity: NOT VERIFIED.** Mongoose `ref` is not a database foreign-key constraint. Several `gymId` validators are conditional on `isNew`, intentionally allowing legacy documents to remain readable; they do not prove stored records contain a valid Gym id.

| Model | Ownership/reference fields | Declared indexes and concerns |
|---|---|---|
| Gym | Tenant root; no owner field | Unique `slug`; status index. Owner identity must be proven through membership and approved business mapping. |
| GymMembership | Required `userId → User`, `gymId → Gym`, role/status | Unique `{userId,gymId}`; `{gymId,role,status}`. Must inspect for duplicate/orphan references and multiple active memberships. |
| User | Global identity; no `gymId` | Global unique email. Platform roles are global and must not be treated as Gym roles. |
| AuthSession | Global `userId → User` | Unique token hash; `expiresAt` TTL. Deployed index/TTL state unknown. |
| Member | Legacy-conditional `gymId → Gym`; required `planId → Plan`; optional `trainerId → Trainer` | Unique `{gymId,phone}`. Trainer id has a standalone index. Any former global phone index can conflict with tenant-scoped duplicates. |
| Plan | Legacy-conditional `gymId → Gym` | Unique `{gymId,name}` with case-insensitive collation. Verify conflicts and deployed collation. |
| Trainer | Legacy-conditional `gymId → Gym` | Unique `{gymId,email}`; also `{fullName,status}`. |
| Subscription | Legacy-conditional `gymId → Gym`; `memberId → Member`, `planId → Plan`; renewal terms reference Plan and optional Payment | Unique `{gymId,createKey}`; non-tenant-prefixed `{memberId,createdAt}` and status index. Renewal history is embedded and must be verified against Payment/Plan relationships. |
| Payment | Legacy-conditional `gymId → Gym`; `memberId → Member`, `planId → Plan`, optional `subscriptionId → Subscription` | Globally unique receipt number; unique partial `{gymId,idempotencyKey}`. Member/date and payment-date indexes are not tenant-prefixed (performance concern, not by themselves an authorization bypass). Preserve receipt history. |
| Attendance | Legacy-conditional `gymId → Gym`; `memberId → Member` | Unique `{gymId,memberId,date}`; standalone date/check-in index. |
| Counter | Legacy-conditional `gymId → Gym` | **Global unique `name` plus unique `{gymId,name}`.** Global name uniqueness can prevent same counter name in different Gyms. Old unowned `paymentReceipt` counter is historical; deployed state unknown. |
| StaffInvitation | Required `gymId → Gym`, optional `acceptedBy → User` | Unique token hash; `gymId`, expiry, and `{gymId,email,status}` indexes. New collection is tenant-specific. |

No Workout or GymSettings model was found in source. The live Atlas collection inventory is BLOCKED; unmodeled collections may exist.

## Findings by severity

### High

**H-1 — Multi-tenant runtime isolation is not proven. Status: NOT VERIFIED / BLOCKED.** The code boundary is tenant-aware, but there is no safe DB inventory, deployed-index verification, or executed two-Gym integration test in this environment. Ownerless legacy records are inaccessible to tenant-filtered reads; the result could be missing data, and stored cross-Gym references/orphans are unknown. Do not enable multi-tenant access or registration based only on source review.

### Medium

**M-1 — Legacy ownership is optional on persisted business records. Status: VERIFIED IN SOURCE; stored impact NOT VERIFIED.** `Member`, `Plan`, `Trainer`, `Subscription`, `Payment`, `Attendance`, and `Counter` use `required() { return this.isNew; }` for `gymId`. This avoids breaking old rows, but only a reviewed migration plus persisted validation can establish complete ownership. See the model files listed above and [`docs/MULTI_TENANT_MIGRATION_AUDIT.md`](MULTI_TENANT_MIGRATION_AUDIT.md).

**M-2 — Staff acceptance and single-active-Gym policy may conflict for an existing User. Status: FIXED IN SOURCE; integration NOT VERIFIED.** Invitation acceptance now serializes acceptances per user inside its MongoDB transaction, checks for another active GymMembership before claiming the invitation, and rolls back without consuming the invitation if one exists. This keeps the single-active-Gym policy and returns a safe conflict response. Disposable-database integration verification remains outstanding.

**M-3 — Trainer memberships have no access to standard tenant APIs. Status: MITIGATED IN SOURCE; legacy memberships unchanged.** New trainer invitations are rejected with a validation message, and pending legacy trainer invitations cannot be redeemed. Existing trainer membership records and role definitions are not changed. Trainer access requires a separately reviewed least-privilege design before invitations are resumed.

**M-4 — Global Counter name uniqueness can collide across tenants. Status: VERIFIED IN SOURCE; deployed index NOT VERIFIED.** [`models/Counter.js:4-9`](../models/Counter.js) declares both global unique `name` and unique `{gymId,name}`. Inspect actual indexes and legacy counter records before tenant rollout; do not drop/rebuild indexes as part of this audit.

### Low / informational

**L-1 — Registration validation runs before the pause response. Status: TESTED.** Valid input returns 503; malformed JSON/fields may return 400 and rejected Origin returns 403. The route performs no DB access/write before responding. This matches the documented “503 after input validation” behavior; clients must not assume every request shape receives 503.

**L-2 — Global indexes on business query fields are not tenant-prefixed. Status: VERIFIED IN SOURCE.** Examples include Member trainerId, Subscription memberId/createdAt, Payment memberId/date and date-only, and Attendance date/check-in. This may affect query efficiency as data grows; it does not remove the tenant predicates reviewed above.

No Critical finding was confirmed from the source inspected. That is not a claim that production data or runtime isolation is secure.

## Existing and executed tests

**Executed:**

- `node --test tests/tenantFoundation.test.js tests/gymOwnerRegistration.test.js tests/adminUsers.test.js tests/paymentRules.test.js tests/subscriptionRules.test.js tests/trainerRules.test.js` — **40 passed, 0 skipped, 0 failed**.
- `npm test` — **51 passed, 3 skipped, 0 failed**. Skips were payment-ledger MongoDB integration, staff-invitation MongoDB integration, and two-Gym tenant-isolation integration.
- `npm run lint` — **passed**.
- `git diff --check` — **passed**.

**Existing coverage in source:** `tests/tenantFoundation.test.js` checks role/membership decisions, forged tenant filters, and statically requires auth/query scoping across gym API routes; `tests/tenantIsolation.integration.test.js` covers two-Gym reads, cross-tenant IDs, updates/deletes and payment/attendance scoping; registration tests cover validation and paused behavior; `tests/adminUsers.test.js` covers platform-superadmin gating.

**Skipped / NOT TESTED:** MongoDB integration tests require `MONGODB_TEST_URI`; none is explicitly configured in the process. `tenantIsolation.integration.test.js`, `paymentLedger.integration.test.js`, and the invitation integration test are therefore skipped by `npm test`. No DB connection was attempted. No deployed indexes, real records, cross-Gym refs, or actual transactions were tested. A passing source/unit test is not production isolation proof.

## Unknowns / blocked evidence

- Actual Atlas database/collection names and counts, including any unmodeled collections.
- Stored `gymId` presence, nulls, malformed values, and Gym references for every document.
- Orphan/cross-Gym Member/Plan/Trainer/Subscription/Payment/Attendance/StaffInvitation relationships, including embedded renewal-history Payment and Plan references.
- Actual deployed index definitions, uniqueness, collation, partial filters, TTL settings, and conflicting legacy global indexes.
- Authoritative existing Gym identity, ownership mapping, existing account memberships, and whether owner assignments are correct.
- Runtime behavior against a replica-set staging fixture, including race conditions and transaction retries.
- Production host/proxy Origin behavior, rate limiting, and operational access controls for CLI scripts.

Do not use `.env.local` application credentials as an audit target. Use an approved sanitized snapshot and an explicit read-only audit URI; do not connect to production.

## Prioritized remediation / next safe step

1. Keep public registration paused and tenant API access fail-closed. Do not enable customer onboarding.
2. Obtain an authorized sanitized non-production snapshot and verify restore. Establish approved Gym and owner identity evidence.
3. Run read-only counts, relationship/orphan checks, duplicate candidate analysis, and actual index inventory on that snapshot; resolve ambiguous records through an approved mapping manifest.
4. Fix or explicitly disposition the single-active-Gym invitation conflict and decide trainer permissions before depending on staff access.
5. Only after those results, design and test an idempotent migration against disposable staging, preserving ids and financial history; rehearse rollback and index transition.
6. Run full two-Gym route-level tests for unauthenticated requests, invalid membership, forged `gymId`, foreign IDs, update paths, role boundaries, nested references, aggregation outputs and registration pause. Enable multi-tenant access only after independent data reconciliation and staging approval.

**Baseline conclusion:** source authorization is VERIFIED IN SOURCE; end-to-end tenant isolation is NOT VERIFIED and launch is BLOCKED pending safe data/staging evidence.
