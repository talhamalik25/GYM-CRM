import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Gym from "../models/Gym.js";
import GymMembership from "../models/GymMembership.js";
import { authorizeGymMembership } from "../lib/tenantAuthorization.js";
import { readFile } from "node:fs/promises";
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

test("legacy login and database session contract remains present", async () => {
  const loginRoute = await readFile(fileURLToPath(new URL("../app/api/auth/login/route.js", import.meta.url)), "utf8");
  const auth = await readFile(fileURLToPath(new URL("../lib/auth.js", import.meta.url)), "utf8");
  assert.match(loginRoute, /User\.findOne\(\{ email \}\)\.select\("\+passwordHash isActive"\)/);
  assert.match(loginRoute, /return await createSession\(user\._id\)/);
  assert.match(auth, /AuthSession\.findOne\(\{ tokenHash: hashToken\(token\), expiresAt: \{ \$gt: new Date\(\) \} \}\)/);
  assert.match(auth, /export async function getAuthenticatedUserFromRequest\(request\)/);
});
