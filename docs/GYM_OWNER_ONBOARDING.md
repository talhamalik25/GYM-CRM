# Gym Owner Onboarding

## Registration flow

`/register` creates an owner account, a newly generated Gym, an active `gym_owner` membership, and the initial authenticated session. The registration API accepts only `fullName`, `email`, `password`, and `gymName`. Server validation trims names, normalizes email to lowercase to match login, and reuses the existing scrypt password policy. Client-provided roles, permissions, and Gym ids are rejected.

The User's platform role is explicitly `staff`; gym ownership is exclusively the `GymMembership.role` value `gym_owner`. The Gym slug is derived from the submitted gym name with a random suffix, so the request cannot claim an existing Gym by slug or id. The existing session-backed tenant resolver then obtains the one active membership and allows the owner to access that Gym. No legacy business rows are migrated or assigned during registration.

User, Gym, GymMembership, and the initial AuthSession are created inside one MongoDB transaction. The flow requires a transaction-capable MongoDB replica set or compatible deployment. If transaction support is unavailable, registration fails closed with a generic service-unavailable response; it does not fall back to multiple independent writes. The global User email unique index is initialized before the transaction and protects concurrent signup attempts; duplicate submissions receive HTTP 409. Do not remove or weaken this index.

Successful registration sets the existing secure session cookie and redirects to `/dashboard`, matching the current login flow. Existing login and logout routes are unchanged. Expired sessions remain rejected by the existing session lookup.

## Local verification

Use a dedicated, disposable local replica set. Configure the app's `MONGODB_URI` to that development-only deployment and `AUTH_SESSION_SECRET` to at least 32 random bytes through the local process environment. Do not use a production URI or put real secrets in source control. Then start the app and visit `/register`; submit a new email, a password of at least 12 characters, a full name, and a gym name. Successful signup should land on `/dashboard`. Sign out and sign in through `/login` to confirm backward compatibility.

For automated database tests, configure only the explicit `MONGODB_TEST_URI` described in [SAFE_DATABASE_INTEGRATION_TESTING.md](SAFE_DATABASE_INTEGRATION_TESTING.md). The test harness creates a unique per-run database name and refuses an unmarked database name or an undesignated remote host. Run:

```powershell
npm test -- tests/gymOwnerRegistration.integration.test.js
npm test
npm run lint
git diff --check
```

The integration test exercises invalid input, attempted role/Gym/permission forgery, concurrent duplicate email submissions, successful owner membership creation, password hashing, tenant selection through a forged query parameter, and expired-session rejection. It skips when no explicit test URI exists; a skipped run is not integration verification. The test cleans up only rows tied to its randomly generated email, membership, and Gym ids in its per-run test database.

## Abuse protection and operational requirement

No rate-limiting or signup-abuse protection mechanism currently exists in the repository, so this phase does not add an in-memory limiter that would be unreliable across multiple app instances. Before exposing registration publicly, configure request throttling at a trusted edge/API gateway and monitor registration failures. This endpoint intentionally does not create platform administrators or provide billing/payment-provider functionality.
