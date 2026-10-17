import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { isSuperadmin, validateCreateUserBody } from "../lib/adminUserRules.js";

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
  assert.equal(isSuperadmin(null), false);
});

test("admin account API and shared auth helper require superadmin authorization", async () => {
  const source = await readFile(fileURLToPath(new URL("../app/api/admin/users/route.js", import.meta.url)), "utf8");
  const auth = await readFile(fileURLToPath(new URL("../lib/auth.js", import.meta.url)), "utf8");
  assert.equal((source.match(/await requireSuperadminUser\(request\)/g) || []).length, 2);
  assert.match(auth, /export async function requireSuperadminUser\(request\)/);
  assert.match(auth, /if \(requiredRole && user\.role !== requiredRole\) return forbidden\(\)/);
  assert.match(source, /passwordHash:\s*await hashPassword\(validation\.password\)/);
  assert.match(source, /role:\s*"staff"/);
  assert.doesNotMatch(source, /password:\s*user\.password/);
});
