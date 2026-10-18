import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { POST as registerOwner } from "../app/api/auth/register/route.js";
import { POST as loginUser } from "../app/api/auth/login/route.js";
import { getRequestGymId, requireApiUser } from "../lib/auth.js";
import { isolatedTestUri } from "./testDatabaseConfig.js";
import connectToDatabase from "../lib/db.js";
import AuthSession from "../models/AuthSession.js";
import Gym from "../models/Gym.js";
import GymMembership from "../models/GymMembership.js";
import User from "../models/User.js";
import { isSuperadmin } from "../lib/adminUserRules.js";
import { verifyPassword } from "../lib/passwords.js";

const testUri = isolatedTestUri(process.env.MONGODB_TEST_URI, "owner_registration");

function jsonRequest(path, body) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { origin: "http://localhost", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function requestWithSessionCookie(url, cookieName, token) {
  const request = new Request(url);
  Object.defineProperty(request, "cookies", {
    value: { get: (name) => name === cookieName ? { value: token } : undefined },
  });
  return request;
}

test("owner registration atomically creates a tenant account, prevents escalation, and authenticates only its gym", { skip: !testUri }, async () => {
  const priorMongoUri = process.env.MONGODB_URI;
  const priorSecret = process.env.AUTH_SESSION_SECRET;
  process.env.MONGODB_URI = testUri;
  process.env.AUTH_SESSION_SECRET = randomBytes(32).toString("hex");

  const suffix = randomUUID();
  const email = `owner-${suffix}@example.test`;
  let existingGymId;

  try {
    await connectToDatabase();
    await Promise.all([User.init(), Gym.init(), GymMembership.init(), AuthSession.init()]);
    const existingGym = await Gym.create({ name: "Existing Synthetic Gym", slug: `existing-${suffix}` });
    existingGymId = existingGym._id;

    const invalidResponse = await registerOwner(jsonRequest("/api/auth/register", {
      fullName: "Owner", email: "invalid", password: "short", gymName: "New Synthetic Gym",
    }));
    assert.equal(invalidResponse.status, 400);

    const forgedResponse = await registerOwner(jsonRequest("/api/auth/register", {
      fullName: "Owner", email, password: "a-long-owner-password", gymName: "New Synthetic Gym",
      role: "superadmin", gymId: String(existingGymId), membershipRole: "gym_owner", permissions: ["*"],
    }));
    assert.equal(forgedResponse.status, 400);
    assert.equal(await User.countDocuments({ email }), 0);
    assert.equal(await Gym.countDocuments({ name: "New Synthetic Gym" }), 0);

    const attempts = await Promise.all([
      registerOwner(jsonRequest("/api/auth/register", { fullName: "Owner One", email, password: "a-long-owner-password", gymName: "North Fitivo" })),
      registerOwner(jsonRequest("/api/auth/register", { fullName: "Owner Two", email: email.toUpperCase(), password: "another-long-owner-password", gymName: "South Fitivo" })),
    ]);
    assert.deepEqual(attempts.map((response) => response.status).sort(), [201, 409]);
    const successResponse = attempts.find((response) => response.status === 201);
    const result = await successResponse.json();
    assert.equal(result.success, true);
    assert.equal(result.data.redirectTo, "/dashboard");

    const owner = await User.findOne({ email }).select("+passwordHash").lean();
    assert.ok(owner);
    assert.equal(owner.role, "staff");
    assert.equal(isSuperadmin(owner), false);
    assert.equal(await verifyPassword("a-long-owner-password", owner.passwordHash) || await verifyPassword("another-long-owner-password", owner.passwordHash), true);
    assert.equal(await User.countDocuments({ email }), 1);

    const memberships = await GymMembership.find({ userId: owner._id, status: "active" }).lean();
    assert.equal(memberships.length, 1);
    assert.equal(memberships[0].role, "gym_owner");
    const gym = await Gym.findById(memberships[0].gymId).lean();
    assert.ok(gym);
    assert.notEqual(String(gym._id), String(existingGymId));
    assert.ok(gym.slug.startsWith("north-fitivo-") || gym.slug.startsWith("south-fitivo-"));

    const cookieName = process.env.NODE_ENV === "production" ? "__Host-fitivo_session" : "fitivo_session";
    const sessionToken = successResponse.cookies.get(cookieName)?.value;
    assert.ok(sessionToken);
    const forgedSelectionRequest = requestWithSessionCookie(
      `http://localhost/api/members?gymId=${existingGymId}`,
      cookieName,
      sessionToken,
    );
    assert.equal(await requireApiUser(forgedSelectionRequest), null);
    assert.equal(String(getRequestGymId(forgedSelectionRequest)), String(gym._id));

    const ownerPassword = owner.fullName === "Owner One" ? "a-long-owner-password" : "another-long-owner-password";
    const loginResponse = await loginUser(jsonRequest("/api/auth/login", { email, password: ownerPassword }));
    assert.equal(loginResponse.status, 200);
    assert.equal((await loginResponse.json()).success, true);

    await AuthSession.updateMany({ userId: owner._id }, { $set: { expiresAt: new Date(0) } });
    const expiredRequest = requestWithSessionCookie("http://localhost/api/members", cookieName, sessionToken);
    const expiredResponse = await requireApiUser(expiredRequest);
    assert.equal(expiredResponse.status, 401);
  } finally {
    if (mongoose.connection.readyState === 1) {
      const owners = await User.find({ email }).select("_id").lean();
      const ownerIds = owners.map((owner) => owner._id);
      const ownerMemberships = ownerIds.length
        ? await GymMembership.find({ userId: { $in: ownerIds } }).select("gymId").lean()
        : [];
      if (ownerIds.length) {
        await AuthSession.deleteMany({ userId: { $in: ownerIds } });
        await GymMembership.deleteMany({ userId: { $in: ownerIds } });
        await User.deleteMany({ _id: { $in: ownerIds } });
      }
      const gymsCreatedByTest = await Gym.find({ name: { $in: ["Existing Synthetic Gym", "North Fitivo", "South Fitivo"] } }).select("_id").lean();
      const gymIds = [...ownerMemberships.map((membership) => membership.gymId), ...gymsCreatedByTest.map((gym) => gym._id), existingGymId].filter(Boolean);
      if (gymIds.length) await Gym.deleteMany({ _id: { $in: gymIds } });
    }
    await mongoose.disconnect();
    if (priorMongoUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = priorMongoUri;
    if (priorSecret === undefined) delete process.env.AUTH_SESSION_SECRET;
    else process.env.AUTH_SESSION_SECRET = priorSecret;
  }
});
