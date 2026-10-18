import test from "node:test";
import assert from "node:assert/strict";
import { isolatedTestUri } from "./testDatabaseConfig.js";

test("test database URI is absent when no explicit test URI is configured", () => {
  assert.equal(isolatedTestUri(undefined, "tenant_isolation", { processId: 1, runId: "run" }), null);
});

test("test database URI requires a test-marked source database name", () => {
  assert.throws(
    () => isolatedTestUri("mongodb://localhost:27017/fitivo", "tenant_isolation", { processId: 1, runId: "run" }),
    /must name a database containing a test/,
  );
});

test("remote test databases require an explicit disposable designation", () => {
  const uri = "mongodb+srv://example.test/fitivo_test";
  assert.throws(
    () => isolatedTestUri(uri, "tenant_isolation", { allowRemoteDisposable: false, processId: 1, runId: "run" }),
    /Remote MONGODB_TEST_URI refused/,
  );
});

test("test database URI is isolated to a fresh per-run database and retains connection options", () => {
  const result = isolatedTestUri(
    "mongodb://localhost:27017/fitivo_test?replicaSet=rs0",
    "payment_ledger",
    { processId: 123, runId: "safe-run" },
  );
  const uri = new URL(result);
  assert.equal(uri.pathname, "/payment_ledger_test_123_safe-run");
  assert.equal(uri.searchParams.get("replicaSet"), "rs0");
});

test("remote disposable database can be used only when explicitly acknowledged", () => {
  const result = isolatedTestUri(
    "mongodb+srv://example.test/fitivo_disposable",
    "tenant_isolation",
    { allowRemoteDisposable: true, processId: 123, runId: "safe-run" },
  );
  assert.equal(new URL(result).pathname, "/tenant_isolation_test_123_safe-run");
});
