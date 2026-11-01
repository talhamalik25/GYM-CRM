import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { NextRequest } from "next/server.js";
import AuthSession from "../models/AuthSession.js";
import User from "../models/User.js";
import Gym from "../models/Gym.js";
import GymMembership from "../models/GymMembership.js";
import Member from "../models/Member.js";
import Plan from "../models/Plan.js";
import Trainer from "../models/Trainer.js";
import Subscription from "../models/Subscription.js";
import Payment from "../models/Payment.js";
import Attendance from "../models/Attendance.js";
import Branch from "../models/Branch.js";
import AuditLog from "../models/AuditLog.js";
import StaffInvitation from "../models/StaffInvitation.js";
import AuthRateLimit from "../models/AuthRateLimit.js";
import { LAUNCH_PLANS } from "../config/plans.js";
import { PUBLIC_RATE_LIMITS } from "../config/security.js";
import { consumePublicAttempt } from "../lib/loginSecurity.js";
import { createTermPayment, sumTermPayments, findIdempotentPayment, voidMemberPayment } from "../lib/paymentLedger.js";
import { calculateOutstandingBalance } from "../lib/paymentRules.js";

const projectUrl = new URL("../", import.meta.url).href;
registerHooks({ resolve(specifier, context, nextResolve) {
  if (context.parentURL?.startsWith(projectUrl) && !context.parentURL.includes("/node_modules/") && specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier)) {
    const candidate = new URL(`${specifier}.js`, context.parentURL);
    if (existsSync(candidate)) return nextResolve(candidate.href, context);
  }
  return nextResolve(specifier, context);
} });

const gymA = "507f1f77bcf86cd799439011", gymB = "507f1f77bcf86cd799439022";
const actor = "507f1f77bcf86cd799439033", resource = "507f1f77bcf86cd799439044";
const planId = "507f1f77bcf86cd799439055";
const cookie = process.env.NODE_ENV === "production" ? "__Host-fitivo_session" : "fitivo_session";
const clone = (value) => structuredClone(value);
function query(value) {
  return { select() { return this; }, session() { return this; }, populate() { return this; }, sort() { return this; }, skip() { return this; }, limit() { return this; },
    lean: async () => clone(value), then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); } };
}
function scopeGym(filter) {
  if (filter?.gymId) return String(filter.gymId);
  return filter?.$and?.map(scopeGym).find(Boolean);
}
function request(route, method = "GET", body, extraHeaders = {}) {
  return new NextRequest(`http://localhost/api/${route}?gymId=${gymB}&role=gym_owner`, { method,
    headers: { cookie: `${cookie}=${randomBytes(32).toString("base64url")}`, origin: "http://localhost", "content-type": "application/json", "Idempotency-Key": "security-test-key-00001", ...extraHeaders },
    ...(method === "GET" ? {} : { body: typeof body === "string" ? body : JSON.stringify(body ?? {}) }),
  });
}
async function call(route, method, body, id = resource) {
  const mod = await import(new URL(`../app/api/${route}/route.js`, import.meta.url));
  return mod[method](request(route.replaceAll("[id]", id), method, body), { params: Promise.resolve({ id }) });
}
function setup(t, role = "gym_owner") {
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
  t.mock.method(mongoose, "connect", () => { throw new Error("Tests must never connect to an application database."); });
  const session = { inTransaction: () => true, withTransaction: async (fn) => fn(), endSession: async () => {} };
  t.mock.method(mongoose, "startSession", async () => session);
  t.mock.method(mongoose.connection, "transaction", async (fn) => fn(session));
  const gym = { _id: gymA, status: "active", timezone: "Asia/Karachi", saasSubscription: { status: "active", periodEnd: new Date("2099-01-01"), planSnapshot: LAUNCH_PLANS.find((p) => p.key === "professional") } };
  t.mock.method(AuthSession, "findOne", () => query({ userId: actor, authVersion: 0 }));
  t.mock.method(User, "findOne", () => query({ _id: actor, email: "synthetic@example.test", role: "staff", authVersion: 0 }));
  t.mock.method(GymMembership, "find", () => query([{ userId: actor, gymId: gymA, role, status: "active" }]));
  t.mock.method(Gym, "findById", () => query(gym));
  t.mock.method(Gym, "findOneAndUpdate", (filter) => { assert.equal(String(filter._id), gymA); return query(gym); });
  for (const Model of [Member, Trainer, GymMembership, Branch]) t.mock.method(Model, "countDocuments", (filter) => { assert.equal(scopeGym(filter), gymA); return query(0); });
  for (const Model of [Payment, Subscription, Attendance]) t.mock.method(Model, "init", async () => {});
  return session;
}

test("cross-gym resource handlers reject foreign ids and ignore a forged gym query", async (t) => {
  const cases = [
    ["members/[id]", "GET", Member], ["members/[id]", "PATCH", Member, { fullName: "Synthetic Member" }],
    ["plans/[id]", "GET", Plan], ["plans/[id]", "PATCH", Plan, { name: "Synthetic Plan" }],
    ["trainers/[id]", "GET", Trainer], ["trainers/[id]", "PATCH", Trainer, { fullName: "Synthetic Trainer" }],
    ["payments/[id]", "GET", Payment], ["payments/[id]", "PATCH", Payment, { action: "void", reason: "Synthetic test" }],
    ["subscriptions/[id]", "GET", Subscription], ["subscriptions/[id]", "PATCH", Subscription, { status: "cancelled" }],
    ["subscriptions/[id]/renew", "POST", Subscription, {}],
    ["subscriptions/[id]/payments", "POST", Subscription, { amountPaid: 100, method: "cash" }],
    ["attendance/check-in", "POST", Member, { memberId: resource }],
    ["attendance/[id]/check-out", "POST", Attendance, {}],
    ["members/[id]/subscriptions", "GET", Member],
  ];
  for (const [route, method, Model, body] of cases) await t.test(`${method} ${route}: Pass`, async (t) => {
    setup(t);
    let reads = 0;
    for (const operation of ["findOne", "findOneAndUpdate", "exists"]) t.mock.method(Model, operation, (filter) => {
      assert.equal(scopeGym(filter), gymA, "resource lookup must constrain the authenticated gym"); reads++; return query(null);
    });
    const response = await call(route, method, body);
    assert.equal(response.status, 404, await response.text());
    assert.ok(reads > 0);
  });
});

test("staff and trainer role restrictions are enforced by actual handlers", async (t) => {
  for (const role of ["gym_admin", "trainer"]) for (const [route, method] of [
    ["plans", "POST"], ["plans/[id]", "PATCH"], ["reports", "GET"], ["payment-reports", "GET"], ["exports", "GET"],
    ["payments/[id]", "PATCH"], ["gym/settings", "PATCH"], ["staff/manage", "PATCH"], ["staff/invitations", "POST"],
  ]) await t.test(`${role}: ${method} ${route}: Pass`, async (t) => {
    setup(t, role);
    assert.equal((await call(route, method, { role: "gym_owner", gymId: gymB })).status, 403);
  });
  for (const route of ["members", "plans", "payments", "subscriptions", "trainers"]) await t.test(`trainer cannot list ${route}: Pass`, async (t) => {
    setup(t, "trainer"); assert.equal((await call(route, "GET")).status, 403);
  });
});

test("attendance check-in rejects a role without attendance permission", async (t) => {
  setup(t, "staff");
  assert.equal((await call("attendance/check-in", "POST", { memberId: resource })).status, 403);
});

test("write validation rejects ObjectIds, assignment fields, non-object JSON and oversized bodies", async (t) => {
  for (const [route, method] of [["members/[id]", "PATCH"], ["plans/[id]", "PATCH"], ["trainers/[id]", "PATCH"], ["payments/[id]", "PATCH"], ["subscriptions/[id]", "PATCH"], ["subscriptions/[id]/renew", "POST"], ["subscriptions/[id]/payments", "POST"], ["attendance/[id]/check-out", "POST"]]) await t.test(`invalid id: ${route}: Pass`, async (t) => {
    setup(t); assert.equal((await call(route, method, {}, "not-an-id")).status, 400);
  });
  for (const route of ["members", "plans", "trainers", "payments", "subscriptions", "attendance/check-in", "staff/invitations", "branches"]) await t.test(`invalid body: ${route}: Pass`, async (t) => {
    setup(t);
    for (const body of [{ gymId: gymB, role: "gym_owner", passwordHash: "forged" }, "null", "[]", "{", { notes: "x".repeat(17000) }]) {
      const response = await call(route, "POST", body);
      assert.equal(response.status, body?.notes ? 413 : 400, await response.text());
    }
  });
});

test("subscription create and renewal cannot override the database price", async (t) => {
  for (const route of ["subscriptions", "subscriptions/[id]/renew"]) await t.test(`${route}: Pass`, async (t) => {
    setup(t);
    const member = { _id: resource, gymId: gymA, isActive: true };
    const subscription = { _id: resource, memberId: resource, planId, gymId: gymA, status: "active", startDate: new Date("2020-01-01"), expiryDate: new Date("2099-01-01"), renewalHistory: [{ renewalKey: "old", expiryDate: new Date("2099-01-01") }] };
    t.mock.method(Subscription, "findOne", (filter) => { assert.equal(scopeGym(filter), gymA); return query(route === "subscriptions" ? null : subscription); });
    t.mock.method(Member, "findOne", (filter) => { assert.equal(scopeGym(filter), gymA); return query(member); });
    t.mock.method(Plan, "findOne", (filter) => { assert.equal(scopeGym(filter), gymA); return query({ _id: planId, isActive: true, price: 2000, durationDays: 30 }); });
    t.mock.method(Payment, "create", () => { throw new Error("A forged price must not write a payment."); });
    const body = { planId, agreedPrice: 1, ...(route === "subscriptions" ? { memberId: resource, startDate: "2026-11-01" } : {}) };
    const response = await call(route, "POST", body);
    assert.equal(response.status, 400, await response.text());
  });
});

test("payment void preserves the receipt, audits the actor, excludes collections and prevents replay", async (t) => {
  const session = setup(t);
  let payment = { _id: resource, gymId: gymA, subscriptionId: planId, amountPaid: 1000, amountDue: 2000, receiptNumber: "SYNTHETIC", requestFingerprint: "same" };
  const audits = [];
  t.mock.method(Payment, "findOne", (filter) => { assert.equal(scopeGym(filter), gymA); return query(payment); });
  t.mock.method(Subscription, "findOne", (filter) => { assert.equal(scopeGym(filter), gymA); return query({ _id: planId, gymId: gymA, __v: 0 }); });
  t.mock.method(Subscription, "updateOne", async (filter) => { assert.equal(scopeGym(filter), gymA); return { modifiedCount: 1 }; });
  t.mock.method(Payment, "findOneAndUpdate", (filter, update) => { assert.equal(scopeGym(filter), gymA); assert.deepEqual(filter.voided, { $ne: true }); payment = { ...payment, ...update.$set }; return query(payment); });
  t.mock.method(AuditLog, "create", async (rows, options) => { assert.equal(options.session, session); audits.push(...rows); return rows; });
  const response = await call("payments/[id]", "PATCH", { action: "void", reason: "Duplicate synthetic entry" });
  assert.equal(response.status, 200, await response.text());
  assert.equal(payment.receiptNumber, "SYNTHETIC"); assert.equal(payment.amountPaid, 1000); assert.equal(payment.voidedBy, actor);
  assert.deepEqual(audits.map(({ action, actorId, gymId }) => ({ action, actorId, gymId })), [{ action: "payment.voided", actorId: actor, gymId: gymA }]);
  assert.equal((await call("payments/[id]", "PATCH", { action: "void", reason: "Retry" })).status, 409);
  assert.equal(audits.length, 1);
  await assert.rejects(findIdempotentPayment("key", "same", session, gymA), { status: 409 });
  t.mock.method(Payment, "find", (filter) => { assert.equal(scopeGym(filter), gymA); assert.deepEqual(filter.voided, { $ne: true }); return query([]); });
  assert.equal(await sumTermPayments(planId, "term", session, gymA), 0);
  // The voided PKR 1,000 payment contributes zero paid against the PKR 2,000 invoice.
  assert.deepEqual(calculateOutstandingBalance(2000, [payment]), { agreedAmount: 2000, paid: 0, outstanding: 2000 });
  payment = { ...payment, subscriptionId: null, voided: false };
  await voidMemberPayment({ id: resource, scope: { gymId: gymA }, actorId: actor, reason: "Legacy payment correction" }, session);
  assert.equal(payment.voided, true);
  assert.equal(payment.receiptNumber, "SYNTHETIC");
  assert.equal(audits.length, 2);
  assert.equal(audits[1].action, "payment.voided");
});

test("member payment summary is gym scoped and rejects malformed or operator-shaped member queries", async (t) => {
  setup(t);
  let lookups = 0;
  t.mock.method(Member, "findOne", (filter) => {
    assert.equal(scopeGym(filter), gymA);
    lookups += 1;
    return query(null);
  });
  const { GET } = await import("../app/api/payments/summary/route.js");
  const makeRequest = (memberId) => new NextRequest(`http://localhost/api/payments/summary?memberId=${memberId}&gymId=${gymB}`, {
    headers: { cookie: `${cookie}=${randomBytes(32).toString("base64url")}` },
  });
  const foreign = await GET(makeRequest(resource));
  assert.equal(foreign.status, 404);
  assert.equal(lookups, 1);
  const injection = await GET(makeRequest(encodeURIComponent('{"$ne":null}')));
  assert.equal(injection.status, 400);
  assert.equal(lookups, 1);
});

test("payment void route rejects NoSQL operator keys", async (t) => {
  setup(t);
  for (const body of [{ $ne: null }, { $where: "1" }]) {
    const response = await call("payments/[id]", "PATCH", body);
    assert.equal(response.status, 400, await response.text());
  }
});

test("public limiter uses per-identity and global budgets without leaking identities", async (t) => {
  const counts = new Map();
  t.mock.method(AuthRateLimit, "findOneAndUpdate", (filter) => {
    const attempts = (counts.get(filter._id) || 0) + 1; counts.set(filter._id, attempts); return query({ attempts });
  });
  for (const [kind, limits] of Object.entries(PUBLIC_RATE_LIMITS)) {
    for (let i = 0; i < limits.identity; i++) assert.equal((await consumePublicAttempt(kind, "SYNTHETIC@example.test", 1000)).allowed, true);
    assert.equal((await consumePublicAttempt(kind, "synthetic@example.test", 1000)).allowed, false);
    for (let i = limits.identity + 1; i < limits.global; i++) assert.equal((await consumePublicAttempt(kind, `identity-${i}`, 1000)).allowed, true);
    assert.equal((await consumePublicAttempt(kind, "fresh-identity", 1000)).allowed, false);
    assert.equal((await consumePublicAttempt(kind, "synthetic@example.test", 900001)).allowed, true);
  }
  assert.ok(!JSON.stringify([...counts.keys()]).includes("example.test"));
});
