# Safe MongoDB Integration Testing

This guide covers all eight MongoDB integration suites in `tests/`. It does not configure or run a production migration.

## Database requirements

Several suites exercise multi-document transactions. Use a transaction-capable MongoDB replica set or compatible deployment; a standalone `mongod` does not support these transactions. For local testing, use a replica set created specifically for development/testing.

Use a disposable database on a test-only MongoDB instance. The URI must name a database containing `test`, `testing`, or `disposable`, such as `fitivo_test`. The harness replaces that database path with a unique per-run database named `test_<32 hexadecimal characters>`.

The default allowed host is loopback (`localhost`, `127.0.0.1`, or `::1`). A remote test cluster is refused unless the process also has `MONGODB_TEST_DISPOSABLE=YES`. Set that only after independently verifying the cluster is dedicated to disposable tests and the test account cannot access production data. The marker and acknowledgment are safeguards, not a way to make a production URI safe.

The harness compares the test target against `MONGODB_URI` in the process and application `.env` files (base, local, development, and production variants). It reads those files only for comparison: it does not load their credentials into the test process or fall back to them. Matching servers or reused username/password pairs are refused even with the disposable flag. Loopback aliases are treated as the same host; a dedicated local replica set on another port is supported. These checks cannot detect every DNS alias or externally configured production deployment, so independent verification remains required.

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
npm run test:unit
npm run lint
git diff --check
```

`npm test` uses a preflight before starting any suites. It reads only the two test settings from `.env.test.local`, with process settings taking precedence. A configured URI that fails safety validation stops the run before connection. `npm run test:unit` explicitly clears database targets in its child process and skips the eight integration suites. A run with those suites skipped is not database-backed verification. Confirm all eight integration suites pass with no skips before claiming database verification.

## Coverage and cleanup

- Tenant isolation creates synthetic Gym A/Gym B records and checks tenant-scoped reads, forged query filters, cross-Gym member/plan/subscription payment references, guarded updates/deletes, and per-Gym receipt sequence allocation.
- The payment-ledger test checks transaction retries/idempotency, partial and concurrent installments, rollback after a simulated failure, and that an aborted payment can leave a receipt counter gap because the counter increment is reserved outside the payment transaction.
- The other suites cover Superadmin Gym and overview data, public trial registration and expiry, SaaS entitlement enforcement, staff invitation lifecycle, and owner profile updates.
- Suites exercise models, helpers, and selected actual route handlers; they do not replace browser tests for every authenticated workflow.
- Tests use randomized test records and a fresh database name per run. Cleanup drops that generated database, including its collections and indexes. `Model.init()` may create schema indexes there. Never point these tests at a shared application deployment.
- If a process is forcibly terminated, its cleanup may not run. The unique database name limits collision risk. Inspect the exact database name and confirm it is a test-run database before any manual cleanup; do not use broad wildcard deletion or cleanup against a production host.

The harness preserves URI query options such as `replicaSet`, but changes the database path before connecting. The source URI's database name must still clearly identify it as test/disposable. Remote designation is an explicit operator assertion and must only be used for a confirmed test-only deployment.

The active process configuration can change between runs. Check the test output
for skipped suites and safety errors each time; do not treat a previously
successful run as evidence that the current test URI is safe.

## Database-free browser smoke

After a production build, `node scripts/browser-smoke.js` launches a loopback-only server and headless Chrome with application/test database URIs and cron secrets explicitly blank, a random synthetic session secret, and registration disabled. It checks public rendering, anonymous redirects/API rejection, headers, request rejection, and sessionless logout. No database cleanup runs. It cannot verify successful login, tenant data, branch permissions with real sessions, or billing transactions. Use `localhost` for the browser origin because NextRequest normalizes loopback IP addresses to that hostname.
