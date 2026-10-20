import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { adminUserRoleLabel, isSuperadmin, serializeAdminUser, validateCreateUserBody } from "../lib/adminUserRules.js";

test("safe user summaries include optional names and role labels recognize both superadmin aliases", () => {
  const summary = serializeAdminUser({
    _id: "account-id", fullName: "Platform Admin", email: "admin@example.test", role: "platform_super_admin",
    isActive: true, createdAt: new Date("2026-05-01T00:00:00Z"), passwordHash: "never-return", authToken: "never-return",
  });
  assert.deepEqual(summary, {
    id: "account-id", fullName: "Platform Admin", email: "admin@example.test", role: "platform_super_admin",
    isActive: true, createdAt: new Date("2026-05-01T00:00:00Z"),
  });
  assert.equal(serializeAdminUser({ _id: "legacy-id", email: "legacy@example.test" }).fullName, "");
  assert.equal(adminUserRoleLabel({ role: "platform_super_admin" }), "Superadmin");
  assert.equal(adminUserRoleLabel({ role: "superadmin" }), "Superadmin");
  assert.equal(adminUserRoleLabel({ role: "staff" }), "Staff");
});

test("new account validation normalizes email and accepts valid password lengths", () => {
  const valid = validateCreateUserBody({ email: "  Staff@Example.com ", password: "a-long-unique-password" });
  assert.deepEqual(valid, { email: "staff@example.com", password: "a-long-unique-password" });
  assert.equal(validateCreateUserBody({ email: "bad", password: "a-long-unique-password" }).fields.email, "Enter a valid email address.");
  assert.equal(validateCreateUserBody({ email: "staff@example.com", password: "short" }).fields.password, "Password must be at least 12 characters and no more than 128 bytes.");
});

test("account creation cannot accept a caller-selected role", () => {
  const result = validateCreateUserBody({ email: "staff@example.com", password: "a-long-unique-password", role: "superadmin" });
  assert.equal(result.fields.role, "This field cannot be changed.");
  assert.equal(isSuperadmin({ role: "staff" }), false);
  assert.equal(isSuperadmin({ role: "superadmin" }), true);
  assert.equal(isSuperadmin({ role: "platform_super_admin" }), true);
  assert.equal(isSuperadmin(null), false);
});

test("admin account API and shared auth helper require superadmin authorization", async () => {
  const source = await readFile(fileURLToPath(new URL("../app/api/admin/users/route.js", import.meta.url)), "utf8");
  const auth = await readFile(fileURLToPath(new URL("../lib/auth.js", import.meta.url)), "utf8");
  const manager = await readFile(fileURLToPath(new URL("../components/admin/admin-user-manager.js", import.meta.url)), "utf8");
  assert.equal((source.match(/await requireSuperadminUser\(request\)/g) || []).length, 2);
  assert.match(auth, /export async function requireSuperadminUser\(request\)/);
  assert.match(auth, /requiredRole === "superadmin" && isSuperadmin\(user\)/);
  assert.match(source, /passwordHash:\s*await hashPassword\(validation\.password\)/);
  assert.match(source, /select\("fullName email role isActive createdAt"\)/);
  assert.match(source, /role:\s*"staff"/);
  assert.doesNotMatch(source, /password:\s*user\.password/);
  assert.match(manager, /adminUserRoleLabel\(user\)/);
  assert.match(manager, /Name unavailable/);
});
