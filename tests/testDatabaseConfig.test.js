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
  assert.match(uri.pathname, /^\/test_[0-9a-f]{32}$/);
  assert.ok(Buffer.byteLength(uri.pathname.slice(1), "utf8") <= 38);
  assert.equal(uri.searchParams.get("replicaSet"), "rs0");
});

test("generated database names remain unique across suites, processes, and runs", () => {
  const makeUri = (suiteName, processId, runId) => new URL(isolatedTestUri(
    "mongodb://localhost:27017/fitivo_test",
    suiteName,
    { processId, runId },
  )).pathname;
  const names = new Set([
    makeUri("payment_ledger", 123, "run-a"),
    makeUri("tenant_isolation", 123, "run-a"),
    makeUri("payment_ledger", 124, "run-a"),
    makeUri("payment_ledger", 123, "run-b"),
  ]);

  assert.equal(names.size, 4);
  for (const pathname of names) {
    assert.ok(Buffer.byteLength(pathname.slice(1), "utf8") <= 38);
  }
});

test("remote disposable database can be used only when explicitly acknowledged", () => {
  const result = isolatedTestUri(
    "mongodb+srv://example.test/fitivo_disposable",
    "tenant_isolation",
    { allowRemoteDisposable: true, processId: 123, runId: "safe-run" },
  );
  assert.match(new URL(result).pathname, /^\/test_[0-9a-f]{32}$/);
});

test("a disposable flag cannot authorize the application server or reused credentials", () => {
  const options = { allowRemoteDisposable: true, applicationUris: ["mongodb+srv://app-user:app-password@application.example/app"] };
  for (const uri of [
    "mongodb+srv://test-user:test-password@application.example/fitivo_test",
    "mongodb+srv://app-user:app-password@test.example/fitivo_test",
  ]) assert.throws(() => isolatedTestUri(uri, "safety", options), /host or credentials are reused/);
  assert.ok(isolatedTestUri("mongodb+srv://test-user:test-password@test.example/fitivo_test", "safety", options));
});

test("separate local ports are allowed but the application's default MongoDB port is refused", () => {
  const options = { applicationUris: ["mongodb://localhost/app"] };
  assert.throws(() => isolatedTestUri("mongodb://localhost:27017/fitivo_test", "safety", options), /host or credentials are reused/);
  assert.throws(() => isolatedTestUri("mongodb://127.0.0.1:27017/fitivo_test", "safety", options), /host or credentials are reused/);
  assert.ok(isolatedTestUri("mongodb://localhost:27018/fitivo_test", "safety", options));
});
