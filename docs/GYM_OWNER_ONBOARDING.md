# Gym Owner Onboarding

## Registration flow

**Current status: public registration is paused.** `/register` shows a maintenance message and the API returns HTTP 503 after input validation. The former flow described below is not currently available while legacy data ownership and tenant isolation remain unverified. Do not re-enable it until the migration gates in [MULTI_TENANT_MIGRATION_AUDIT.md](MULTI_TENANT_MIGRATION_AUDIT.md) pass.

When it was enabled, `/register` created an owner account, a newly generated Gym, an active `gym_owner` membership, and the initial authenticated session. The registration API accepted only `fullName`, `email`, `password`, and `gymName`. Server validation trimmed names, normalized email to lowercase to match login, and reused the existing scrypt password policy. Client-provided roles, permissions, and Gym ids were rejected.

The User's platform role is explicitly `staff`; gym ownership is exclusively the `GymMembership.role` value `gym_owner`. The Gym slug is derived from the submitted gym name with a random suffix, so the request cannot claim an existing Gym by slug or id. The existing session-backed tenant resolver then obtains the one active membership and allows the owner to access that Gym. No legacy business rows are migrated or assigned during registration.

User, Gym, GymMembership, and the initial AuthSession are created inside one MongoDB transaction. The flow requires a transaction-capable MongoDB replica set or compatible deployment. If transaction support is unavailable, registration fails closed with a generic service-unavailable response; it does not fall back to multiple independent writes. The global User email unique index is initialized before the transaction and protects concurrent signup attempts; duplicate submissions receive HTTP 409. Do not remove or weaken this index.

Successful registration sets the existing secure session cookie and redirects to `/dashboard`, matching the current login flow. Existing login and logout routes are unchanged. Expired sessions remain rejected by the existing session lookup.

## Historical local verification (not currently available)

The former signup flow was designed for a dedicated, disposable local replica set. Do not use the procedure below while public registration is paused. Signup behavior must only be re-enabled after the migration audit gates pass and the service owner approves a separate change.

For automated database tests, configure only the explicit `MONGODB_TEST_URI` described in [SAFE_DATABASE_INTEGRATION_TESTING.md](SAFE_DATABASE_INTEGRATION_TESTING.md). The test harness creates a unique per-run database name and refuses an unmarked database name or an undesignated remote host. Run:

```powershell
npm test -- tests/gymOwnerRegistration.integration.test.js
npm test
npm run lint
git diff --check
```

The current registration test verifies that valid public signup returns HTTP 503 and that invalid/forged requests are rejected without database access. The former end-to-end signup test is no longer applicable while registration is paused. A successful signup test must be restored only when registration is deliberately re-enabled after tenant migration verification.

## Abuse protection and operational requirement

No rate-limiting or signup-abuse protection mechanism currently exists in the repository, so this phase does not add an in-memory limiter that would be unreliable across multiple app instances. Before exposing registration publicly, configure request throttling at a trusted edge/API gateway and monitor registration failures. This endpoint intentionally does not create platform administrators or provide billing/payment-provider functionality.
