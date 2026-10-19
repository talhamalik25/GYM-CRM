import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { POST as assignOwner } from "../app/api/admin/gym-owners/route.js";
import { validateGymOwnerAssignment } from "../lib/adminGymRules.js";

const gymId = "507f1f77bcf86cd799439011";

test("owner assignment accepts a Gym and normalized account email, and rejects forged fields", () => {
  assert.deepEqual(validateGymOwnerAssignment({ gymId, email: " Owner@Example.test " }), { gymId, email: "owner@example.test" });
  assert.equal(validateGymOwnerAssignment({ gymId: "bad", email: "owner@example.test" }).fields.gymId, "Choose a valid gym.");
  assert.equal(validateGymOwnerAssignment({ gymId, email: "bad-email" }).fields.email, "Enter a valid account email address.");
  assert.equal(validateGymOwnerAssignment({ gymId, email: "owner@example.test", role: "superadmin" }).fields.role, "This field cannot be changed.");
});

test("only a platform superadmin can invoke the Gym owner assignment endpoint", async () => {
  const response = await assignOwner(new Request("http://localhost/api/admin/gym-owners", { method: "POST", body: "{}" }));
  assert.equal(response.status, 401);
});

test("assignment requires an active staff account and preserves the single-active-Gym policy", async () => {
  const route = await readFile(fileURLToPath(new URL("../app/api/admin/gym-owners/route.js", import.meta.url)), "utf8");
  const resolver = await readFile(fileURLToPath(new URL("../lib/tenantContext.js", import.meta.url)), "utf8");
  assert.match(route, /requireSuperadminUser\(request\)/);
  assert.match(route, /Gym\.findOne\(\{ _id: validation\.gymId, status: "active" \}\)/);
  assert.match(route, /User\.findOne\(\{ email: validation\.email \}\)\.select\("_id email fullName role isActive"\)/);
  assert.match(route, /user\.role !== "staff"/);
  assert.match(route, /GymMembership\.find\(\{ userId: user\._id, status: "active" \}\)/);
  assert.match(route, /activeMemberships\.length === 1[\s\S]*role === "gym_owner"/);
  assert.match(route, /role: "gym_owner", status: "active"/);
  assert.match(resolver, /memberships\.length !== 1/);
});

test("superadmin Gym listing provides an owner assignment action and clear membership guidance", async () => {
  const manager = await readFile(fileURLToPath(new URL("../components/admin/admin-gym-manager.js", import.meta.url)), "utf8");
  const users = await readFile(fileURLToPath(new URL("../components/admin/admin-user-manager.js", import.meta.url)), "utf8");
  assert.match(manager, /Assign or repair owner access/);
  assert.match(manager, /api\/admin\/gym-owners/);
  assert.match(manager, /active Gym assignment/);
  assert.match(users, /needs an active Gym membership before it can open a workspace/);
});
