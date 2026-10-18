import test from "node:test";
import assert from "node:assert/strict";
import { validateGymOwnerRegistrationBody } from "../lib/gymOwnerRegistration.js";
import { POST as registerOwner } from "../app/api/auth/register/route.js";

const valid = {
  fullName: "  Gym Owner  ",
  email: "  OWNER@EXAMPLE.TEST ",
  password: "a-long-owner-password",
  gymName: "  Fitivo North  ",
};

test("gym owner registration trims names and normalizes email", () => {
  assert.deepEqual(validateGymOwnerRegistrationBody(valid), {
    fullName: "Gym Owner",
    email: "owner@example.test",
    password: valid.password,
    gymName: "Fitivo North",
  });
});

test("gym owner registration rejects malformed and short input", () => {
  assert.equal(validateGymOwnerRegistrationBody(null).message, "Request body must be a JSON object.");
  const result = validateGymOwnerRegistrationBody({ ...valid, fullName: " ", email: "bad", password: "short", gymName: " " });
  assert.ok(result.fields.fullName);
  assert.ok(result.fields.email);
  assert.ok(result.fields.password);
  assert.ok(result.fields.gymName);
});

test("gym owner registration rejects client-selected roles, permissions, and gym ids", () => {
  const result = validateGymOwnerRegistrationBody({
    ...valid,
    role: "superadmin",
    membershipRole: "gym_owner",
    gymId: "507f1f77bcf86cd799439011",
    permissions: ["*"],
  });
  assert.equal(result.fields.role, "This field cannot be changed.");
  assert.equal(result.fields.membershipRole, "This field cannot be changed.");
  assert.equal(result.fields.gymId, "This field cannot be changed.");
  assert.equal(result.fields.permissions, "This field cannot be changed.");
});

test("registration route rejects invalid input and forged ownership fields before database access", async () => {
  const makeRequest = (body) => new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { origin: "http://localhost", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const invalidResponse = await registerOwner(makeRequest({ ...valid, email: "invalid", password: "short" }));
  assert.equal(invalidResponse.status, 400);

  const forgedResponse = await registerOwner(makeRequest({
    ...valid,
    role: "superadmin",
    membershipRole: "gym_owner",
    gymId: "507f1f77bcf86cd799439011",
    permissions: ["*"],
  }));
  assert.equal(forgedResponse.status, 400);
  const body = await forgedResponse.json();
  assert.equal(body.success, false);
  assert.equal(body.error.fields.gymId, "This field cannot be changed.");
});

test("registration route rejects a mismatched origin", async () => {
  const response = await registerOwner(new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { origin: "http://attacker.invalid", "content-type": "application/json" },
    body: JSON.stringify(valid),
  }));
  assert.equal(response.status, 403);
});
