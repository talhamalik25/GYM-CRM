# MongoDB integration tests

Eight integration suites use MongoDB when `MONGODB_TEST_URI` is explicitly
configured:

- `adminGymDetails.integration.test.js`
- `adminOverview.integration.test.js`
- `gymOwnerRegistration.integration.test.js`
- `paymentLedger.integration.test.js`
- `saasEntitlements.integration.test.js`
- `staffInvitations.integration.test.js`
- `tenantIsolation.integration.test.js`
- `userProfile.integration.test.js`

Use only a dedicated disposable MongoDB instance. Payment, registration,
invitation, profile, tenant-isolation, and entitlement scenarios can use
transactions and require a replica set. The test URI must name a database with
`test`, `testing`, or `disposable` in its name. Each suite derives a unique
per-run database from that URI. Loopback hosts are allowed by default; a remote
host requires the explicit `MONGODB_TEST_DISPOSABLE=YES` designation after you
have independently confirmed it is disposable.

For a separate local test replica set, start MongoDB with its own empty data
directory and initialize the replica set. For example:

```powershell
mongod --replSet rs0 --bind_ip 127.0.0.1 --port 27018 --dbpath C:\mongo-fitivo-test-data
mongosh "mongodb://127.0.0.1:27018/admin" --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"127.0.0.1:27018"}]})'
$env:MONGODB_TEST_URI = "mongodb://127.0.0.1:27018/fitivo_test?replicaSet=rs0&retryWrites=true&w=majority"
npm test
```

The test harness does not fall back to `MONGODB_URI`. An absent test URI skips
the integration suites; a configured URI that fails validation stops the test
run before connecting. Tests clean up their generated records and do not drop
databases or collections. See
[`docs/SAFE_DATABASE_INTEGRATION_TESTING.md`](../docs/SAFE_DATABASE_INTEGRATION_TESTING.md)
for the safety checks and test-data lifecycle.
