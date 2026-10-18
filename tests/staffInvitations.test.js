import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { POST as inviteStaff } from "../app/api/staff/invitations/route.js";
import { POST as acceptInvitation } from "../app/api/staff/invitations/accept/route.js";
import { createInvitationToken, hashInvitationToken, validateStaffInvitationBody } from "../lib/staffInvitations.js";

test("staff invitation validation normalizes email and limits roles", () => {
  assert.deepEqual(validateStaffInvitationBody({ email: "  STAFF@EXAMPLE.TEST ", role: "trainer" }), { email: "staff@example.test", role: "trainer" });
  assert.ok(validateStaffInvitationBody({ email: "staff@example.test", role: "gym_owner" }).fields.role);
  assert.ok(validateStaffInvitationBody({ email: "staff@example.test", role: "trainer", gymId: "forged" }).fields.gymId);
});

test("invitation tokens are high entropy and stored as one-way hashes", () => {
  const { token, tokenHash } = createInvitationToken();
  assert.equal(Buffer.from(token, "base64url").length, 32);
  assert.equal(tokenHash, hashInvitationToken(token));
  assert.notEqual(tokenHash, token);
});

test("unauthenticated users cannot invite staff", async () => {
  const request = new Request("http://localhost/api/staff/invitations", { method: "POST", headers: { origin: "http://localhost", "content-type": "application/json" }, body: JSON.stringify({ email: "staff@example.test", role: "trainer" }) });
  const response = await inviteStaff(request);
  assert.equal(response.status, 401);
});

test("invitation acceptance rejects malformed tokens before database access", async () => {
  const request = new Request("http://localhost/api/staff/invitations/accept", { method: "POST", headers: { origin: "http://localhost", "content-type": "application/json" }, body: JSON.stringify({ token: "short" }) });
  const response = await acceptInvitation(request);
  assert.equal(response.status, 400);
});

test("forged roles and gym ids are rejected by invitation endpoint before database access", async () => {
  const request = new Request("http://localhost/api/staff/invitations", { method: "POST", headers: { origin: "http://localhost", "content-type": "application/json" }, body: JSON.stringify({ email: "staff@example.test", role: "gym_owner", gymId: randomBytes(12).toString("hex") }) });
  const response = await inviteStaff(request);
  assert.equal(response.status, 401);
});
