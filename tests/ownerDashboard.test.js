import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { GET as getOwnerDashboard } from "../app/api/dashboard/owner/route.js";
import { getOwnerSetupSteps, serializeOwnerDashboard } from "../lib/ownerDashboardRules.js";

test("owner dashboard response contains only safe gym context and scoped counts", () => {
  const gym = { name: "Fitivo Club", slug: "fitivo-club", status: "active", timezone: "Asia/Karachi", _id: "private-id", ownerEmail: "secret@example.test" };
  const result = serializeOwnerDashboard(gym, { members: 4, plans: 2, trainers: 1, payments: 999 });
  assert.deepEqual(result, {
    gym: { name: "Fitivo Club", slug: "fitivo-club", status: "active", timezone: "Asia/Karachi" },
    counts: { members: 4, plans: 2, trainers: 1 },
  });
  assert.equal(JSON.stringify(result).includes("secret@example.test"), false);
  assert.equal(JSON.stringify(result).includes("payments"), false);
});

test("setup guidance marks existing workspace resources complete and links missing steps", () => {
  assert.deepEqual(getOwnerSetupSteps({ members: 0, plans: 1, trainers: 0 }), [
    { key: "plans", label: "Create a membership plan", href: "/memberships/plans/new", complete: true },
    { key: "trainers", label: "Add a trainer", href: "/trainers/new", complete: false },
    { key: "members", label: "Add your first member", href: "/members/new", complete: false },
  ]);
});

test("owner dashboard endpoint requires authentication and gym owner membership", async () => {
  const response = await getOwnerDashboard(new Request("http://localhost/api/dashboard/owner"));
  assert.equal(response.status, 401);
  const source = await readFile(fileURLToPath(new URL("../app/api/dashboard/owner/route.js", import.meta.url)), "utf8");
  assert.match(source, /requireApiUser\(request, \{ allowedRoles: \["gym_owner"\] \}\)/);
  assert.match(source, /getRequestTenantContext\(request\)/);
  assert.match(source, /Member\.countDocuments\(scope\)/);
  assert.match(source, /Plan\.countDocuments\(scope\)/);
  assert.match(source, /Trainer\.countDocuments\(scope\)/);
  assert.doesNotMatch(source, /request\.json|searchParams\.get\("gymId"\)/);
});

test("owner dashboard exposes loading, retry, missing-context, setup, and existing feature links", async () => {
  const source = await readFile(fileURLToPath(new URL("../components/dashboard/owner-dashboard.js", import.meta.url)), "utf8");
  assert.match(source, /Loading gym dashboard/);
  assert.match(source, /role="alert"/);
  assert.match(source, /Try again/);
  assert.match(source, /could not be found/);
  assert.match(source, /Finish setting up your gym/);
  for (const href of ["/members", "/memberships", "/trainers", "/attendance", "/payments"]) assert.ok(source.includes(`href: "${href}"`));
});
