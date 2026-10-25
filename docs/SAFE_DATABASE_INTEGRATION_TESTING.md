# Safe MongoDB Integration Testing

This guide covers all eight MongoDB integration suites in `tests/`. It does not configure or run a production migration.

## Database requirements

Several suites exercise multi-document transactions. Use a transaction-capable MongoDB replica set or compatible deployment; a standalone `mongod` does not support these transactions. For local testing, use a replica set created specifically for development/testing.

Use a disposable database on a test-only MongoDB instance. The URI must name a database containing `test`, `testing`, or `disposable`, such as `fitivo_test`. The harness replaces that database path with a unique per-run database, for example `tenant_isolation_test_<pid>_<run-id>` or `payment_ledger_test_<pid>_<run-id>`.

The default allowed host is loopback (`localhost`, `127.0.0.1`, or `::1`). A remote test cluster is refused unless the process also has `MONGODB_TEST_DISPOSABLE=YES`. Set that only after independently verifying the cluster is dedicated to disposable tests and the test account cannot access production data. The marker and acknowledgment are safeguards, not a way to make a production URI safe. The harness never reads `.env` or `.env.local` and never falls back to `MONGODB_URI`.

Configure the URI in the current PowerShell session without printing it:

```powershell
$env:MONGODB_TEST_URI = 'mongodb://127.0.0.1:27017/fitivo_test?replicaSet=rs0'
```

For an independently verified remote disposable deployment, set the explicit acknowledgment in that same process session:

```powershell
$env:MONGODB_TEST_DISPOSABLE = 'YES'
```

Use the remote deployment's own credentials and a least-privilege account limited to disposable test databases. Do not copy production credentials or a production URI. Do not put real credentials into shell history, source control, test output, or documentation.

## Run commands

From the repository root in PowerShell, after the URI points to the verified disposable replica set:

```powershell
npm test -- tests/tenantIsolation.integration.test.js tests/paymentLedger.integration.test.js
npm test
npm run lint
git diff --check
```

The eight integration suites skip when `MONGODB_TEST_URI` is absent. A configured URI that fails safety validation throws an error rather than skipping. A successful `npm test` with those suites skipped is not database-backed verification. Confirm all eight integration suites pass with no skips before claiming database verification.

## Coverage and cleanup

- Tenant isolation creates synthetic Gym A/Gym B records and checks tenant-scoped reads, forged query filters, cross-Gym member/plan/subscription payment references, guarded updates/deletes, and per-Gym receipt sequence allocation.
- The payment-ledger test checks transaction retries/idempotency, partial and concurrent installments, rollback after a simulated failure, and that an aborted payment can leave a receipt counter gap because the counter increment is reserved outside the payment transaction.
- The other suites cover Superadmin Gym and overview data, public trial registration and expiry, SaaS entitlement enforcement, staff invitation lifecycle, and owner profile updates.
- These are direct model/helper integration tests; they do not replace end-to-end authenticated HTTP tests for every route.
- Tests use randomized test records and a fresh database name per run. Cleanup deletes only test-owned documents scoped by generated Gym/member identifiers and removes that run's Gym-owned counters. It does not drop databases, collections, or indexes. `Model.init()` may create schema indexes in the isolated run database.
- If a process is forcibly terminated, its cleanup may not run. The unique database name limits collision risk. Inspect the exact database name and confirm it is a test-run database before any manual cleanup; do not use broad wildcard deletion or cleanup against a production host.

The harness preserves URI query options such as `replicaSet`, but changes the database path before connecting. The source URI's database name must still clearly identify it as test/disposable. Remote designation is an explicit operator assertion and must only be used for a confirmed test-only deployment.

The active process configuration can change between runs. Check the test output
for skipped suites and safety errors each time; do not treat a previously
successful run as evidence that the current test URI is safe.
