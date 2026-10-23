# MongoDB integration tests

Seven integration suites are skipped unless `MONGODB_TEST_URI` is explicitly set:
`adminGymDetails`, `adminOverview`, `paymentLedger`, `staffInvitations`,
`tenantIsolation`, `userProfile`, and `gymOwnerRegistration`. They exercise real MongoDB operations; the
payment ledger, Gym provisioning, staff invitations, owner profile, and tenant
isolation and public registration suites require replica-set transactions.

Use a dedicated disposable MongoDB instance, never a production or shared
application database. For a local MongoDB installation, start a separate
`mongod` process with its own empty data directory:

```powershell
mongod --replSet rs0 --bind_ip 127.0.0.1 --port 27018 --dbpath C:\mongo-fitivo-test-data
```

Initialize the replica set once:

```powershell
mongosh "mongodb://127.0.0.1:27018/admin" --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"127.0.0.1:27018"}]})'
```

Set an explicitly test-marked source database name and run tests:

```powershell
$env:MONGODB_TEST_URI = "mongodb://127.0.0.1:27018/fitivo_test?replicaSet=rs0&retryWrites=true&w=majority"
npm test
```

Each integration suite derives a unique database name (suite, process ID, and
run ID) from that source URI. The URI helper rejects names without `test`,
`testing`, or `disposable`; remote deployments also require
`MONGODB_TEST_DISPOSABLE=YES`. The suites create synthetic records and clean up
their own fixtures. Do not point the setting at production: test isolation is
enforced by naming and per-run database selection, but the code cannot verify
that an operator-designated remote deployment is truly disposable.
