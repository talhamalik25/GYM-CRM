import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Gym from "../models/Gym.js";
import GymMembership from "../models/GymMembership.js";
import Member from "../models/Member.js";
import Plan from "../models/Plan.js";
import Subscription from "../models/Subscription.js";
import Payment from "../models/Payment.js";
import Attendance from "../models/Attendance.js";
import Trainer from "../models/Trainer.js";
import { authorizeGymMembership } from "../lib/tenantAuthorization.js";
import { scopedTenantFilter } from "../lib/tenantQuery.js";
import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const userId = new mongoose.Types.ObjectId();
const gymId = new mongoose.Types.ObjectId();
const base = {
  user: { _id: userId, isActive: true },
  membership: { _id: new mongoose.Types.ObjectId(), userId, gymId, role: "gym_owner", status: "active" },
  gym: { _id: gymId, status: "active" },
};

test("Gym defaults timezone and validates normalized slug shape", async () => {
  const gym = new Gym({ name: "  Fitivo Central  ", slug: "Fitivo-Central" });
  assert.equal(gym.name, "Fitivo Central");
  assert.equal(gym.slug, "fitivo-central");
  assert.equal(gym.timezone, "Asia/Karachi");
  assert.equal(await gym.validate().then(() => true), true);
  const badSlug = new Gym({ name: "Bad", slug: "two words" });
  await assert.rejects(badSlug.validate(), (error) => Boolean(error.errors.slug));
  assert.ok(Gym.schema.indexes().some(([keys, options]) => keys.slug === 1 && options.unique));
});

test("gym membership requires a supported gym role and unique user/gym pair index", async () => {
  const membership = new GymMembership({ ...base.membership });
  assert.equal(await membership.validate().then(() => true), true);
  const invalidRole = new GymMembership({ ...base.membership, role: "superadmin" });
  await assert.rejects(invalidRole.validate(), (error) => Boolean(error.errors.role));
  assert.ok(GymMembership.schema.indexes().some(([keys, options]) => keys.userId === 1 && keys.gymId === 1 && options.unique));
});

test("new gym-owned documents require gymId while schemas retain a legacy-compatible field", async () => {
  const id = new mongoose.Types.ObjectId();
  const planSnapshot = { name: "Plan", durationDays: 30, originalPrice: 100, agreedPrice: 100 };
  const documents = [
    new Member({ fullName: "Member", phone: "1234567", gender: "Other", planId: id, startDate: new Date(), expiryDate: new Date() }),
    new Plan({ name: "Plan", price: 100, durationDays: 30 }),
    new Subscription({ memberId: id, planId: id, startDate: new Date(), expiryDate: new Date(), originalPrice: 100, agreedPrice: 100, planSnapshot, createKey: "key", createFingerprint: "fingerprint" }),
    new Payment({ memberId: id, planId: id, amountDue: 100, amountPaid: 0, method: "cash", paymentDate: new Date(), receiptNumber: "FIT-0001" }),
    new Attendance({ memberId: id, date: "2026-10-18", checkInAt: new Date() }),
    new Trainer({ fullName: "Trainer", email: "trainer@example.test", phone: "+1234567890", specialization: "Fitness", joiningDate: new Date() }),
  ];
  for (const document of documents) {
    await assert.rejects(document.validate(), (error) => Boolean(error.errors.gymId));
    assert.equal(document.schema.path("gymId").options.required.call({ isNew: false }), false);
  }
});

test("gym authorization rejects missing membership, wrong role, and requested cross-gym id", () => {
  assert.equal(authorizeGymMembership({ user: base.user, gym: base.gym }).status, 403);
  assert.equal(authorizeGymMembership({ ...base, allowedRoles: ["gym_admin"] }).status, 403);
  assert.equal(authorizeGymMembership({ ...base, requestedGymId: new mongoose.Types.ObjectId() }).status, 403);
  assert.equal(authorizeGymMembership(base).ok, true);
});

test("inactive users and suspended gyms are denied", () => {
  assert.equal(authorizeGymMembership({ ...base, user: { ...base.user, isActive: false } }).status, 401);
  assert.equal(authorizeGymMembership({ ...base, gym: { ...base.gym, status: "suspended" } }).status, 403);
});

test("tenant filters cannot be overridden by caller-supplied gym ids", () => {
  const otherGymId = new mongoose.Types.ObjectId();
  const filter = scopedTenantFilter(gymId, { gymId: otherGymId, $or: [{ fullName: "A" }, { phone: "B" }] });
  assert.deepEqual(filter.$and[0], { gymId });
  assert.deepEqual(filter.$and[1].gymId, otherGymId);
  assert.throws(() => scopedTenantFilter(null, {}), /trusted gym context/);
});

test("legacy login and database session contract remains present", async () => {
  const loginRoute = await readFile(fileURLToPath(new URL("../app/api/auth/login/route.js", import.meta.url)), "utf8");
  const auth = await readFile(fileURLToPath(new URL("../lib/auth.js", import.meta.url)), "utf8");
  assert.match(loginRoute, /User\.findOne\(\{ email \}\)\.select\("\+passwordHash isActive"\)/);
  assert.match(loginRoute, /return await createSession\(user\._id\)/);
  assert.match(auth, /AuthSession\.findOne\(\{ tokenHash: hashToken\(token\), expiresAt: \{ \$gt: new Date\(\) \} \}\)/);
  assert.match(auth, /export async function getAuthenticatedUserFromRequest\(request\)/);
});

test("every gym-data API route requires tenant authorization and an explicit query scope", async () => {
  const root = fileURLToPath(new URL("../app/api", import.meta.url));
  const routeFiles = [];
  async function collect(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await collect(path);
      else if (entry.name === "route.js") routeFiles.push(path);
    }
  }
  await collect(root);
  const gymRoutes = routeFiles.filter((path) => !["admin\\users\\route.js", "auth\\login\\route.js", "auth\\logout\\route.js"].some((suffix) => path.endsWith(suffix)));
  assert.ok(gymRoutes.length > 0);
  for (const path of gymRoutes) {
    const source = await readFile(path, "utf8");
    assert.match(source, /requireApiUser\(/, `${path} must require an authenticated gym membership`);
    assert.match(source, /tenantFilter\(|getRequestGymId\(/, `${path} must scope its database operations`);
  }
});
