import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, relative, sep } from "node:path";
import { publicTrialSubscription, registrationGymSlug, validateGymOwnerRegistrationBody } from "../lib/gymOwnerRegistration.js";
import { isSaaSAccessAllowed, authorizeGymMembership } from "../lib/tenantAuthorization.js";
import { publicGymOperationalRedirect, trialSummary } from "../lib/publicTrialAccess.js";
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

test("registration fails closed before database access when activation is not configured", async () => {
  const previous = process.env.PUBLIC_REGISTRATION_ENABLED;
  delete process.env.PUBLIC_REGISTRATION_ENABLED;
  try {
    const response = await registerOwner(new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { origin: "http://localhost", "content-type": "application/json" },
    body: JSON.stringify(valid),
  }));
  assert.equal(response.status, 503);
    assert.match((await response.json()).error.message, /registration is currently unavailable/i);
  } finally {
    if (previous === undefined) delete process.env.PUBLIC_REGISTRATION_ENABLED;
    else process.env.PUBLIC_REGISTRATION_ENABLED = previous;
  }
});

test("public trial is exactly 168 hours and expires at the millisecond boundary", () => {
  const start = new Date("2026-10-23T15:26:42.123Z");
  const subscription = publicTrialSubscription({ _id: "plan", name: "Trial", price: 1000, interval: "monthly", limits: { members: 25, trainers: 2 } }, start);
  assert.equal(subscription.trialEndsAt - subscription.trialStartedAt, 604800000);
  assert.equal(subscription.trialEndsAt.toISOString(), "2026-10-30T15:26:42.123Z");
  assert.deepEqual(subscription.planSnapshot.limits, { members: 25, trainers: 2 });
  assert.equal(isSaaSAccessAllowed(subscription, new Date(start.getTime() - 1), true), false);
  assert.equal(isSaaSAccessAllowed(subscription, new Date(subscription.trialEndsAt.getTime() - 1), true), true);
  assert.equal(isSaaSAccessAllowed(subscription, subscription.trialEndsAt, true), false);
  assert.equal(isSaaSAccessAllowed(subscription, new Date(subscription.trialEndsAt.getTime() + 1), true), false);
  const gym = { status: "active", publicTrial: { version: 1, startedAt: start, endsAt: subscription.trialEndsAt }, saasSubscription: subscription };
  assert.equal(publicGymOperationalRedirect(gym, "gym_owner", subscription.trialEndsAt), "/billing");
  assert.equal(publicGymOperationalRedirect(gym, "trainer", subscription.trialEndsAt), "/profile");
  assert.equal(trialSummary(gym, subscription.trialEndsAt).remainingDays, 0);
  assert.equal(trialSummary(gym, subscription.trialEndsAt).status, "expired");
});

test("gym identity normalization is deterministic and client trial terms are rejected", () => {
  assert.equal(registrationGymSlug("  FÍTIVO -- North! "), "fitivo-north");
  assert.equal(registrationGymSlug("Fitivo North"), "fitivo-north");
  for (const field of ["trialStartedAt", "trialEndsAt", "saasSubscription", "publicTrial", "planId", "slug", "isActive"]) {
    assert.ok(validateGymOwnerRegistrationBody({ ...valid, [field]: "forged" }).fields[field]);
  }
  assert.ok(validateGymOwnerRegistrationBody({ ...valid, gymName: "!!!" }).fields.gymName);
});

test("existing gym access policy is unchanged and public page policy never selects existing gyms", () => {
  const now = new Date();
  const future = new Date(now.getTime() + 86400000);
  const past = new Date(now.getTime() - 86400000);
  const fixtures = [
    { expected: true },
    { saasAccessRequired: true, expected: false },
    { saasSubscription: { status: "trialing", trialEndsAt: future }, expected: true },
    { saasSubscription: { status: "trialing", trialEndsAt: past }, expected: false },
    { saasSubscription: { status: "active", periodEnd: future }, expected: true },
    { saasSubscription: { status: "active", periodEnd: past }, expected: false },
    { saasSubscription: { status: "past_due" }, expected: false },
    { saasSubscription: { status: "cancelled" }, expected: false },
    { status: "suspended", expected: false },
  ];
  for (const fixture of fixtures) {
    const gym = { _id: "gym", status: "active", ...fixture };
    const before = structuredClone(gym);
    assert.equal(publicGymOperationalRedirect(gym, "gym_owner", now), null);
    const input = { user: { _id: "owner" }, membership: { userId: "owner", gymId: "gym", role: "gym_owner", status: "active" }, gym };
    assert.equal(authorizeGymMembership(input).ok, fixture.expected);
    assert.deepEqual(gym, before);
  }
});

test("registration route rejects a mismatched origin", async () => {
  const response = await registerOwner(new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { origin: "http://attacker.invalid", "content-type": "application/json" },
    body: JSON.stringify(valid),
  }));
  assert.equal(response.status, 403);
});

test("operational pages guard public expiry while billing, profile and platform pages remain exempt", async () => {
  const root = fileURLToPath(new URL("../app/(dashboard)", import.meta.url));
  let protectedPages = 0;
  async function inspect(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await inspect(path);
      else if (entry.name === "page.js") {
        const parts = relative(root, path).split(sep);
        const source = await readFile(path, "utf8");
        if (parts.length === 1 || ["billing", "profile", "admin"].includes(parts[0])) {
          assert.doesNotMatch(source, /await requirePublicGymOperationalPage\(/, `${path} must remain accessible through its existing policy`);
        } else {
          assert.match(source, /await requirePublicGymOperationalPage\(\)/, `${path} must enforce public expiry on the server`);
          protectedPages++;
        }
      }
    }
  }
  await inspect(root);
  assert.ok(protectedPages >= 20);
});
