import test from "node:test";
import assert from "node:assert/strict";
import { GET, PATCH } from "../app/api/account/profile/route.js";
import { serializeOwnerProfile, validateOwnerProfile } from "../lib/userProfileRules.js";

test("owner profile accepts supported fields and normalizes contact numbers", () => {
  assert.deepEqual(validateOwnerProfile({ fullName: "  Amina Khan ", phone: "+92 (300) 123-4567" }), { fullName: "Amina Khan", phone: "+923001234567" });
  assert.equal(validateOwnerProfile({ fullName: "A", phone: "123" }).fields.fullName, "Name must be between 2 and 120 characters.");
  assert.match(validateOwnerProfile({ fullName: "Amina Khan", phone: "abc" }).fields.phone, /7 to 15 digits/);
  assert.equal(validateOwnerProfile({ fullName: "Amina Khan", phone: "", role: "superadmin" }).fields.role, "This field cannot be changed in your profile.");
  assert.ok(validateOwnerProfile({ fullName: "Amina Khan", phone: "" , userId: "507f1f77bcf86cd799439011" }).fields.userId);
});

test("owner profile serializer returns only display name, email, and phone", () => {
  assert.deepEqual(serializeOwnerProfile({ fullName: "Amina", email: "a@example.test", phone: "+923001234567", role: "superadmin", passwordHash: "secret" }), { fullName: "Amina", email: "a@example.test", phone: "+923001234567" });
});

test("profile APIs reject forged fields, cross-origin writes, and unauthenticated access", async () => {
  const bad = await PATCH(new Request("http://localhost/api/account/profile", { method: "PATCH", headers: { origin: "http://localhost", "content-type": "application/json" }, body: JSON.stringify({ fullName: "Amina Khan", phone: "", userId: "507f1f77bcf86cd799439011" }) }));
  assert.equal(bad.status, 400);
  const csrf = await PATCH(new Request("http://localhost/api/account/profile", { method: "PATCH", headers: { origin: "http://evil.test", "content-type": "application/json" }, body: JSON.stringify({ fullName: "Amina Khan", phone: "" }) }));
  assert.equal(csrf.status, 403);
  const unauthenticated = await GET(new Request("http://localhost/api/account/profile"));
  assert.equal(unauthenticated.status, 401);
});
