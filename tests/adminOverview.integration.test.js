import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { GET as getOverview } from "../app/api/admin/overview/route.js";
import connectToDatabase from "../lib/db.js";
import AuthSession from "../models/AuthSession.js";
import Gym from "../models/Gym.js";
import User from "../models/User.js";
import { isolatedTestUri } from "./testDatabaseConfig.js";

const testUri = isolatedTestUri(process.env.MONGODB_TEST_URI, "admin_overview");
const cookieName = process.env.NODE_ENV === "production" ? "__Host-fitivo_session" : "fitivo_session";

function request(token) {
  const result = new Request("http://localhost/api/admin/overview");
  if (token) Object.defineProperty(result, "cookies", { value: { get: (name) => name === cookieName ? { value: token } : undefined } });
  return result;
}

async function createSession(userId, secret) {
  const token = randomBytes(32).toString("base64url");
  await AuthSession.create({
    userId,
    tokenHash: createHmac("sha256", secret).update(token).digest("hex"),
    expiresAt: new Date(Date.now() + 60000),
  });
  return token;
}

test("platform overview counts Gym and account statuses and rejects non-superadmins", { skip: !testUri }, async () => {
  const previousUri = process.env.MONGODB_URI;
  const previousSecret = process.env.AUTH_SESSION_SECRET;
  const secret = randomBytes(32).toString("hex");
  process.env.MONGODB_URI = testUri;
  process.env.AUTH_SESSION_SECRET = secret;
  const suffix = randomUUID();
  const users = [];
  const gyms = [];
  try {
    await connectToDatabase();
    await Promise.all([User.init(), AuthSession.init(), Gym.init()]);
    const superadmin = await User.create({ email: `overview-admin-${suffix}@example.test`, passwordHash: "test-hash", role: "platform_super_admin", isActive: true });
    const staff = await User.create({ email: `overview-staff-${suffix}@example.test`, passwordHash: "test-hash", role: "staff", isActive: false });
    users.push(superadmin._id, staff._id);
    const activeGym = await Gym.create({ name: "Overview Active Gym", slug: `overview-active-${suffix}`, status: "active" });
    const suspendedGym = await Gym.create({ name: "Overview Suspended Gym", slug: `overview-suspended-${suffix}`, status: "suspended" });
    gyms.push(activeGym._id, suspendedGym._id);

    const [adminToken, staffToken] = await Promise.all([
      createSession(superadmin._id, secret),
      createSession(staff._id, secret),
    ]);
    assert.equal((await getOverview(request(staffToken))).status, 403);

    const response = await getOverview(request(adminToken));
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.deepEqual(payload.data.gyms, { total: 2, active: 1, suspended: 1 });
    assert.deepEqual(payload.data.userAccounts, { total: 2, active: 1, inactive: 1 });
    assert.equal(JSON.stringify(payload).includes("passwordHash"), false);
    assert.equal(Object.hasOwn(payload.data, "members"), false);
    assert.equal(Object.hasOwn(payload.data, "payments"), false);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await AuthSession.deleteMany({ userId: { $in: users } });
      await User.deleteMany({ _id: { $in: users } });
      await Gym.deleteMany({ _id: { $in: gyms } });
    }
    await mongoose.disconnect();
    if (previousUri === undefined) delete process.env.MONGODB_URI; else process.env.MONGODB_URI = previousUri;
    if (previousSecret === undefined) delete process.env.AUTH_SESSION_SECRET; else process.env.AUTH_SESSION_SECRET = previousSecret;
  }
});
