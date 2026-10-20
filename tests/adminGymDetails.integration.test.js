import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { GET as getGym } from "../app/api/admin/gyms/[id]/route.js";
import { GET as listGyms, POST as provisionGym } from "../app/api/admin/gyms/route.js";
import connectToDatabase from "../lib/db.js";
import { hashPassword } from "../lib/passwords.js";
import AuthSession from "../models/AuthSession.js";
import Gym from "../models/Gym.js";
import GymMembership from "../models/GymMembership.js";
import User from "../models/User.js";
import { isolatedTestUri } from "./testDatabaseConfig.js";

const testUri = isolatedTestUri(process.env.MONGODB_TEST_URI, "admin_gym_details");
const cookieName = process.env.NODE_ENV === "production" ? "__Host-fitivo_session" : "fitivo_session";

function request(url, token, options = {}) {
  const result = new Request(`http://localhost${url}`, options);
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

test("superadmin gym detail endpoint validates ids and returns only the selected gym and owner summary", { skip: !testUri }, async () => {
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
    await Promise.all([User.init(), AuthSession.init(), Gym.init(), GymMembership.init()]);
    const superadmin = await User.create({ email: `superadmin-${suffix}@example.test`, passwordHash: await hashPassword("superadmin-test-password-long"), role: "platform_super_admin", isActive: true });
    const owner = await User.create({ fullName: "Gym Owner", email: `owner-${suffix}@example.test`, passwordHash: await hashPassword("owner-test-password-long"), role: "staff", isActive: true });
    const staff = await User.create({ email: `staff-${suffix}@example.test`, passwordHash: await hashPassword("staff-test-password-long"), role: "staff", isActive: true });
    const inactiveOwner = await User.create({ fullName: "Inactive Owner", email: `inactive-owner-${suffix}@example.test`, passwordHash: await hashPassword("inactive-owner-password-long"), role: "staff", isActive: false });
    const provisioningOwner = await User.create({ fullName: "Provisioning Owner", email: `provision-${suffix}@example.test`, passwordHash: await hashPassword("provision-test-password-long"), role: "staff", isActive: true });
    const duplicateSlugOwner = await User.create({ email: `duplicate-${suffix}@example.test`, passwordHash: await hashPassword("duplicate-test-password-long"), role: "staff", isActive: true });
    users.push(superadmin._id, owner._id, staff._id, inactiveOwner._id, provisioningOwner._id, duplicateSlugOwner._id);
    const gym = await Gym.create({ name: "Details Fixture Gym", slug: `details-${suffix}` });
    const otherGym = await Gym.create({ name: "Other Fixture Gym", slug: `other-details-${suffix}` });
    gyms.push(gym._id, otherGym._id);
    await GymMembership.create([
      { userId: owner._id, gymId: gym._id, role: "gym_owner", status: "active" },
      { userId: inactiveOwner._id, gymId: gym._id, role: "gym_owner", status: "active" },
      { userId: staff._id, gymId: otherGym._id, role: "gym_owner", status: "active" },
    ]);
    const adminToken = await createSession(superadmin._id, secret);
    const staffToken = await createSession(staff._id, secret);

    assert.equal((await getGym(request("/api/admin/gyms/bad-id", adminToken), { params: Promise.resolve({ id: "bad-id" }) })).status, 400);
    const missingId = new mongoose.Types.ObjectId().toString();
    assert.equal((await getGym(request(`/api/admin/gyms/${missingId}`, adminToken), { params: Promise.resolve({ id: missingId }) })).status, 404);
    assert.equal((await getGym(request(`/api/admin/gyms/${gym._id}`, staffToken), { params: Promise.resolve({ id: String(gym._id) }) })).status, 403);

    const response = await getGym(request(`/api/admin/gyms/${gym._id}`, adminToken), { params: Promise.resolve({ id: String(gym._id) }) });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.deepEqual(Object.keys(payload.data).sort(), ["createdAt", "id", "name", "owners", "slug", "status", "timezone", "updatedAt"].sort());
    assert.deepEqual(payload.data.owners, [{ name: "Gym Owner", email: owner.email }]);
    assert.equal(JSON.stringify(payload).includes("passwordHash"), false);
    assert.equal(JSON.stringify(payload).includes("tokenHash"), false);
    assert.equal(JSON.stringify(payload).includes("Other Fixture Gym"), false);
    assert.equal(JSON.stringify(payload).includes(staff.email), false);
    assert.equal(Object.hasOwn(payload.data, "members"), false);
    assert.equal(Object.hasOwn(payload.data, "payments"), false);
    const listResponse = await listGyms(request("/api/admin/gyms", adminToken));
    assert.equal(listResponse.status, 200);
    const listedGym = (await listResponse.json()).data.items.find((item) => item.id === String(gym._id));
    assert.deepEqual(listedGym.owners, [{ name: "Gym Owner", email: owner.email }]);

    const provisionResponse = await provisionGym(request("/api/admin/gyms", adminToken, {
      method: "POST", headers: { origin: "http://localhost", "content-type": "application/json" },
      body: JSON.stringify({ name: "Provisioned Gym", slug: `provisioned-${suffix}`, timezone: "Asia/Karachi", ownerEmail: provisioningOwner.email }),
    }));
    assert.equal(provisionResponse.status, 201);
    const provisioned = (await provisionResponse.json()).data.gym;
    gyms.push(new mongoose.Types.ObjectId(provisioned.id));
    assert.deepEqual(provisioned.owners, [{ name: "Provisioning Owner", email: provisioningOwner.email }]);
    assert.equal(await GymMembership.countDocuments({ gymId: provisioned.id, userId: provisioningOwner._id, role: "gym_owner", status: "active" }), 1);

    const countBeforeDuplicate = await Gym.countDocuments({});
    const duplicateResponse = await provisionGym(request("/api/admin/gyms", adminToken, {
      method: "POST", headers: { origin: "http://localhost", "content-type": "application/json" },
      body: JSON.stringify({ name: "Duplicate Slug Gym", slug: `provisioned-${suffix}`, timezone: "UTC", ownerEmail: duplicateSlugOwner.email }),
    }));
    assert.equal(duplicateResponse.status, 409);
    assert.equal(await Gym.countDocuments({}), countBeforeDuplicate);
    assert.equal(await GymMembership.countDocuments({ userId: duplicateSlugOwner._id, status: "active" }), 0);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await AuthSession.deleteMany({ userId: { $in: users } });
      await GymMembership.deleteMany({ userId: { $in: users }, gymId: { $in: gyms } });
      await User.deleteMany({ _id: { $in: users } });
      await Gym.deleteMany({ _id: { $in: gyms } });
    }
    await mongoose.disconnect();
    if (previousUri === undefined) delete process.env.MONGODB_URI; else process.env.MONGODB_URI = previousUri;
    if (previousSecret === undefined) delete process.env.AUTH_SESSION_SECRET; else process.env.AUTH_SESSION_SECRET = previousSecret;
  }
});
