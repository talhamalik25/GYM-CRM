import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server.js";
import User from "../models/User.js";
import AuthSession from "../models/AuthSession.js";
import AuthRateLimit from "../models/AuthRateLimit.js";
import Gym from "../models/Gym.js";
import GymMembership from "../models/GymMembership.js";
import { createSession, getUserFromToken, requireApiUser, getRequestGymId, getRequestScope, requireSuperadminUser, revokeSession, validateRequestOrigin } from "../lib/auth.js";
import { consumeLoginAttempt } from "../lib/loginSecurity.js";
import { hashPassword, verifyPassword } from "../lib/passwords.js";
import { readJsonBody } from "../lib/requestBody.js";
import { POST as login } from "../app/api/auth/login/route.js";
import { POST as register } from "../app/api/auth/register/route.js";
import { POST as acceptInvitation } from "../app/api/staff/invitations/accept/route.js";
import { PATCH as updateProfile } from "../app/api/account/profile/route.js";

const cookieName = process.env.NODE_ENV === "production" ? "__Host-fitivo_session" : "fitivo_session";
const query = (value) => ({ select() { return this; }, session() { return this; }, lean: async () => structuredClone(value) });
function fakeConnection(t) {
  const prior = { cache: globalThis.mongooseCache, uri: process.env.MONGODB_URI, secret: process.env.AUTH_SESSION_SECRET };
  globalThis.mongooseCache = { connection: {}, promise: null };
  process.env.MONGODB_URI = "mongodb://127.0.0.1:1/never_connect";
  process.env.AUTH_SESSION_SECRET = randomBytes(32).toString("hex");
  t.after(() => {
    globalThis.mongooseCache = prior.cache;
    for (const [key, value] of [["MONGODB_URI", prior.uri], ["AUTH_SESSION_SECRET", prior.secret]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
}

test("origin enforcement rejects cross-site writes including missing Origin with Fetch Metadata", () => {
  const req = (headers) => new Request("https://fitivo.example/api/auth/login", { method: "POST", headers });
  assert.equal(validateRequestOrigin(req({ origin: "https://fitivo.example" })), null);
  assert.equal(validateRequestOrigin(req({})), null, "non-browser callers remain compatible");
  for (const headers of [{ origin: "https://evil.example" }, { origin: "null" }, { origin: "malformed" }, { "sec-fetch-site": "cross-site" }]) {
    assert.equal(validateRequestOrigin(req(headers)).status, 403);
  }
});

test("endpoints that parse before authentication reject oversized and malformed bodies before database work", async () => {
  for (const handler of [login, register, acceptInvitation, updateProfile]) {
    const req = (body, headers = {}) => new Request("http://localhost/api", { method: "POST", body, headers });
    assert.equal((await handler(req(JSON.stringify({ extra: "x".repeat(17000) })))).status, 413);
    assert.equal((await handler(req("{}", { "content-length": "17000" }))).status, 413);
    assert.equal((await handler(req("{"))).status, 400);
    assert.equal((await handler(req("{}", { "sec-fetch-site": "cross-site" }))).status, 403);
  }
});

test("JSON size limits count streamed bytes even with a forged small Content-Length", async () => {
  let cancelled = false;
  const stream = new ReadableStream({ pull(controller) { controller.enqueue(new Uint8Array(9000)); }, cancel() { cancelled = true; } });
  const request = new Request("http://localhost", { method: "POST", body: stream, duplex: "half", headers: { "content-length": "1" } });
  await assert.rejects(readJsonBody(request), (error) => error.status === 413);
  assert.equal(cancelled, true);
});

test("login accepts the correct password, uses generic failures, and stops before user lookup when throttled", async (t) => {
  fakeConnection(t);
  let attempts = 0;
  let lookups = 0;
  const user = { _id: "user-id", isActive: true, authVersion: 0, passwordHash: await hashPassword("correct-long-password") };
  let current = user;
  t.mock.method(AuthRateLimit, "findOneAndUpdate", () => query({ attempts: ++attempts }));
  t.mock.method(User, "findOne", () => { lookups++; return query(current); });
  t.mock.method(AuthSession, "create", async () => []);
  const request = (password = "wrong-password") => new Request("http://localhost/api/auth/login", { method: "POST", body: JSON.stringify({ email: "OWNER@example.test", password }) });
  const success = await login(request("correct-long-password"));
  assert.equal(success.status, 200);
  assert.match(success.headers.get("set-cookie"), /HttpOnly/i);
  assert.match(success.headers.get("set-cookie"), /SameSite=strict/i);
  const wrong = await login(request());
  current = null;
  const absent = await login(request());
  current = { ...user, isActive: false };
  const inactive = await login(request("correct-long-password"));
  assert.equal(wrong.status, 401);
  assert.deepEqual(await absent.json(), await inactive.json());
  attempts = 20;
  const before = lookups;
  const limited = await login(request());
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get("retry-after")) > 0);
  assert.equal(lookups, before);
  t.mock.method(AuthRateLimit, "findOneAndUpdate", () => { throw new Error("private-driver-detail"); });
  const log = t.mock.method(console, "error", () => {});
  const unavailable = await login(request());
  assert.equal(unavailable.status, 503);
  assert.equal(lookups, before, "rate-store failure must not bypass the limiter");
  assert.doesNotMatch(await unavailable.text(), /private-driver-detail/);
  assert.doesNotMatch(JSON.stringify(log.mock.calls), /private-driver-detail/);
});

test("shared login limiter handles first-insert contention and normalizes identity without raw email storage", async (t) => {
  const seen = [];
  let calls = 0;
  t.mock.method(AuthRateLimit, "findOneAndUpdate", (filter, update, options) => {
    seen.push({ filter, update, options });
    return { lean: async () => {
      if (++calls === 1) throw Object.assign(new Error("duplicate"), { code: 11000 });
      return { attempts: calls === 2 ? 20 : 21 };
    } };
  });
  assert.equal((await consumeLoginAttempt(" OWNER@EXAMPLE.TEST ", 1000)).allowed, true);
  assert.equal((await consumeLoginAttempt("owner@example.test", 1000)).allowed, false);
  assert.equal(seen[0].filter._id, seen[2].filter._id);
  assert.ok(!JSON.stringify(seen).includes("example.test"));
  await consumeLoginAttempt("owner@example.test", 900001);
  assert.notEqual(seen[0].filter._id, seen[3].filter._id);
});

test("sessions reject changed account versions, inactive users, expired and revoked tokens", async (t) => {
  fakeConnection(t);
  const token = randomBytes(32).toString("base64url");
  let account = { _id: "user-id", email: "owner@example.test", role: "staff", authVersion: 0 };
  let stored = { userId: account._id, authVersion: 0 };
  t.mock.method(AuthSession, "findOne", (filter) => {
    assert.ok(filter.expiresAt.$gt instanceof Date);
    assert.notEqual(filter.tokenHash, token);
    return query(stored);
  });
  t.mock.method(User, "findOne", (filter) => {
    assert.deepEqual(filter.isActive, { $ne: false });
    return query(account);
  });
  assert.equal((await getUserFromToken(token)).email, account.email);
  account.authVersion = 1;
  assert.equal(await getUserFromToken(token), null, "password reset or deactivation invalidates the old session");
  stored.authVersion = 1;
  assert.ok(await getUserFromToken(token));
  account = null;
  assert.equal(await getUserFromToken(token), null);
  stored = null;
  assert.equal(await getUserFromToken(token), null);
  t.mock.method(AuthSession, "deleteOne", async (filter) => { assert.match(filter.tokenHash, /^[a-f0-9]{64}$/); });
  await revokeSession(new NextRequest("http://localhost/api/auth/logout", { headers: { cookie: `${cookieName}=${token}` } }));
  assert.equal(await getUserFromToken("malformed"), null);
});

test("session issuance cannot upgrade stale password verification after an account reset", async (t) => {
  fakeConnection(t);
  t.mock.method(User, "findOne", () => query({ authVersion: 2 }));
  const create = t.mock.method(AuthSession, "create", async () => []);
  await assert.rejects(createSession("user-id", { expectedAuthVersion: 1 }), /authentication changed/);
  assert.equal(create.mock.callCount(), 0);
  const issued = await createSession("user-id", { expectedAuthVersion: 2 });
  assert.equal(create.mock.calls[0].arguments[0][0].authVersion, 2);
  const token = issued.cookies.get(cookieName).value;
  const second = await createSession("user-id", { expectedAuthVersion: 2 });
  assert.notEqual(token, second.cookies.get(cookieName).value);
  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(create.mock.calls[0].arguments[0][0].tokenHash, token);
  assert.equal(issued.cookies.get(cookieName).httpOnly, true);
  assert.equal(issued.cookies.get(cookieName).path, "/");
  assert.equal(issued.cookies.get(cookieName).sameSite, "strict");
  assert.equal(issued.cookies.get(cookieName).secure, process.env.NODE_ENV === "production");
});

test("platform APIs refuse active tenant staff and accept only a current platform role", async (t) => {
  fakeConnection(t);
  t.mock.method(AuthSession, "findOne", () => query({ userId: "u", authVersion: 0 }));
  let role = "staff";
  t.mock.method(User, "findOne", () => query({ _id: "u", role, authVersion: 0 }));
  const request = new NextRequest("http://localhost/api/admin/billing", { headers: { cookie: `${cookieName}=${randomBytes(32).toString("base64url")}` } });
  assert.equal((await requireSuperadminUser(request)).status, 403);
  role = "superadmin";
  assert.equal(await requireSuperadminUser(request), null);
  role = "platform_super_admin";
  assert.equal(await requireSuperadminUser(request), null);
});

test("password verification bounds inputs and rejects malformed hashes", async () => {
  const hash = await hashPassword("correct-long-password");
  assert.equal(await verifyPassword("correct-long-password", hash), true);
  assert.equal(await verifyPassword("wrong-long-password", hash), false);
  assert.equal(await verifyPassword("x".repeat(129), hash), false);
  assert.equal(await verifyPassword("correct-long-password", hash.replace("32768", "2147483648")), false);
});

test("tenant resolution enforces suspension, expiry, roles and branch scope against forged selections", async (t) => {
  fakeConnection(t);
  const gymId = "507f1f77bcf86cd799439011";
  const user = { _id: "user-id", email: "staff@example.test", role: "staff", authVersion: 0 };
  let gym = { _id: gymId, status: "active" };
  let membership = { userId: user._id, gymId, role: "gym_admin", status: "active" };
  t.mock.method(AuthSession, "findOne", () => query({ userId: user._id, authVersion: 0 }));
  t.mock.method(User, "findOne", () => query(user));
  t.mock.method(GymMembership, "find", () => query([membership]));
  t.mock.method(Gym, "findById", () => query(gym));
  const req = (branch) => new NextRequest("http://localhost/api/members?gymId=507f1f77bcf86cd799439022", { headers: {
    cookie: `${cookieName}=${randomBytes(32).toString("base64url")}`, ...(branch ? { "x-fitivo-branch": branch } : {}),
  } });
  const allowed = req();
  assert.equal(await requireApiUser(allowed), null);
  assert.equal(String(getRequestGymId(allowed)), gymId);
  assert.equal(String(getRequestScope(allowed).gymId), gymId);
  assert.equal((await requireApiUser(req("507f1f77bcf86cd799439022"))).status, 403);
  assert.equal((await requireApiUser(req("all"))).status, 403);
  membership = { ...membership, role: "trainer" };
  assert.equal((await requireApiUser(req())).status, 403);
  membership = { ...membership, role: "gym_owner" };
  gym = { ...gym, status: "suspended" };
  assert.equal((await requireApiUser(req())).status, 403);
  gym = { ...gym, status: "active", saasAccessRequired: true, saasSubscription: { status: "active", periodEnd: new Date(0) } };
  assert.equal((await requireApiUser(req())).status, 403);
});
