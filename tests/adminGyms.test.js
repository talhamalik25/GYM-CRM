import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { GET as listGyms } from "../app/api/admin/gyms/route.js";
import { GET as getGym, PATCH as updateGym } from "../app/api/admin/gyms/[id]/route.js";
import { isSuperadmin } from "../lib/adminUserRules.js";
import { filterAdminGyms, serializeAdminGym, validateGymProvisioning, validateGymStatusUpdate } from "../lib/adminGymRules.js";

test("gym listing filters by status and searches gym and safe owner summary fields", () => {
  const gyms = [
    { name: "Northside Fitness", slug: "northside", status: "active", owners: [{ name: "Amina Khan", email: "amina@example.test" }] },
    { name: "Harbor Club", slug: "harbor-club", status: "suspended", owners: [] },
  ];
  assert.deepEqual(filterAdminGyms(gyms, { query: " AMINA@EXAMPLE.TEST " }), [gyms[0]]);
  assert.deepEqual(filterAdminGyms(gyms, { query: "NORTH", status: "active" }), [gyms[0]]);
  assert.deepEqual(filterAdminGyms(gyms, { status: "suspended" }), [gyms[1]]);
  assert.deepEqual(filterAdminGyms(gyms, { query: "missing" }), []);
});

test("gym status updates accept only active or suspended and reject other fields", () => {
  assert.deepEqual(validateGymStatusUpdate({ status: "suspended" }), { status: "suspended" });
  assert.equal(validateGymStatusUpdate({ status: "deleted" }).fields.status, "Choose active or suspended.");
  assert.equal(validateGymStatusUpdate({ status: "active", ownerId: "forged" }).fields.ownerId, "This field cannot be changed.");
  assert.ok(validateGymStatusUpdate([]).message);
});

test("Gym provisioning validates its URL, timezone, and existing owner account", () => {
  const planId = "507f1f77bcf86cd799439011";
  assert.deepEqual(validateGymProvisioning({ name: " Fitivo North ", slug: "Fitivo-North", timezone: "Asia/Karachi", ownerEmail: " OWNER@example.test ", accessMode: "trial", planId, trialDays: 14 }), {
    name: "Fitivo North", slug: "fitivo-north", timezone: "Asia/Karachi", ownerEmail: "owner@example.test", accessMode: "trial", planId, trialDays: 14,
  });
  assert.deepEqual(validateGymProvisioning({ name: "Paused Gym", slug: "paused-gym", timezone: "UTC", ownerEmail: "owner@example.test", accessMode: "none" }), {
    name: "Paused Gym", slug: "paused-gym", timezone: "UTC", ownerEmail: "owner@example.test", accessMode: "none", planId: "", trialDays: null,
  });
  assert.equal(validateGymProvisioning({ name: "Valid Gym", slug: "valid-gym", timezone: "UTC", ownerEmail: "owner@example.test", accessMode: "trial", planId, trialDays: 91 }).fields.trialDays, "Trial length must be from 1 to 90 days.");
  assert.equal(validateGymProvisioning({ name: "Valid Gym", slug: "valid-gym", timezone: "UTC", ownerEmail: "owner@example.test", accessMode: "invoice", planId: "bad" }).fields.planId, "Choose an active SaaS plan.");
  assert.deepEqual(validateGymProvisioning({ name: "Default Trial", slug: "default-trial", timezone: "UTC", ownerEmail: "owner@example.test", accessMode: "trial", planId }, { defaultTrialDays: 30 }).trialDays, 30);
  assert.equal(validateGymProvisioning({ name: "x", slug: "bad slug", timezone: "not/a-zone", ownerEmail: "bad", accessMode: "none" }).fields.slug, "Use lowercase letters, numbers, and single hyphens in the Gym URL.");
  assert.equal(validateGymProvisioning({ name: "x", slug: "bad slug", timezone: "not/a-zone", ownerEmail: "bad", accessMode: "none" }).fields.ownerEmail, "Choose an existing staff account email.");
  assert.equal(validateGymProvisioning({ name: "Valid Gym", slug: "valid-gym", timezone: "UTC", ownerEmail: "owner@example.test", accessMode: "none", status: "suspended" }).fields.status, "This field cannot be changed.");
});

test("gym serialization exposes organization details and only supplied active owner records", () => {
  const gym = { _id: "gym-id", name: "Sample Gym", slug: "sample-gym", status: "active", timezone: "Asia/Karachi", createdAt: new Date("2026-01-01T00:00:00Z") };
  assert.deepEqual(serializeAdminGym(gym), {
    id: "gym-id", name: "Sample Gym", slug: "sample-gym", status: "active", timezone: "Asia/Karachi",
    createdAt: gym.createdAt, updatedAt: undefined, owners: [],
  });
  assert.deepEqual(serializeAdminGym(gym, [{ userId: { fullName: "Gym Owner", email: "owner@example.test", passwordHash: "never-return" } }]).owners, [
    { name: "Gym Owner", email: "owner@example.test" },
  ]);
});

test("gym list and status endpoints require platform superadmin authorization", async () => {
  const listResponse = await listGyms(new Request("http://localhost/api/admin/gyms"));
  const createResponse = await (await import("../app/api/admin/gyms/route.js")).POST(new Request("http://localhost/api/admin/gyms", { method: "POST", headers: { origin: "http://localhost", "content-type": "application/json" }, body: JSON.stringify({ name: "Gym", slug: "gym", timezone: "UTC", ownerEmail: "owner@example.test" }) }));
  const patchResponse = await updateGym(new Request("http://localhost/api/admin/gyms/507f1f77bcf86cd799439011", {
    method: "PATCH", headers: { origin: "http://localhost", "content-type": "application/json" }, body: JSON.stringify({ status: "suspended" }),
  }), { params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }) });
  const detailResponse = await getGym(new Request("http://localhost/api/admin/gyms/507f1f77bcf86cd799439011"), { params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }) });
  assert.equal(listResponse.status, 401);
  assert.equal(createResponse.status, 401);
  assert.equal(patchResponse.status, 401);
  assert.equal(detailResponse.status, 401);
  assert.equal(isSuperadmin({ role: "platform_super_admin" }), true);
  assert.equal(isSuperadmin({ role: "superadmin" }), true);
  assert.equal(isSuperadmin({ role: "gym_owner" }), false);

  const listSource = await readFile(fileURLToPath(new URL("../app/api/admin/gyms/route.js", import.meta.url)), "utf8");
  const updateSource = await readFile(fileURLToPath(new URL("../app/api/admin/gyms/[id]/route.js", import.meta.url)), "utf8");
  assert.equal((updateSource.match(/await requireSuperadminUser\(request\)/g) || []).length, 2);
  assert.match(updateSource, /Gym\.findById\(id\)\.select\("name slug status timezone createdAt updatedAt publicTrial saasSubscription planChangeRequest"\)/);
  assert.match(updateSource, /PlatformInvoice\.find\(\{ gymId: gym\._id \}\)/);
  assert.match(updateSource, /serializeGymSaaSSubscription\(gym\.saasSubscription, invoices\)/);
  assert.match(updateSource, /populate\(\{ path: "userId", match: \{ isActive: \{ \$ne: false \} \}, select: "fullName email" \}\)/);
  assert.doesNotMatch(updateSource, /models\/(?:Payment|Subscription|Member)\.js|Member\.find/);
  assert.match(listSource, /await requireSuperadminUser\(request\)/);
  assert.match(updateSource, /await requireSuperadminUser\(request\)/);
  assert.match(listSource, /role: "gym_owner", status: "active"/);
  assert.match(listSource, /match: \{ isActive: \{ \$ne: false \} \}/);
  assert.match(listSource, /await requireSuperadminUser\(request\)/);
  assert.match(listSource, /session\.withTransaction/);
  assert.match(listSource, /GymMembership\.create\(\[\{ userId: owner\._id, gymId: gym\._id, role: "gym_owner", status: "active" \}\], \{ session \}\)/);
  assert.match(updateSource, /\$set: \{ status: validation\.status \}/);
  const gymPage = await readFile(fileURLToPath(new URL("../app/(dashboard)/admin/gyms/page.js", import.meta.url)), "utf8");
  const userPage = await readFile(fileURLToPath(new URL("../app/(dashboard)/admin/users/page.js", import.meta.url)), "utf8");
  const dashboardShell = await readFile(fileURLToPath(new URL("../components/layout/dashboard-shell.js", import.meta.url)), "utf8");
  assert.match(gymPage, /if \(!isSuperadmin\(user\)\) redirect/);
  assert.match(userPage, /if \(!isSuperadmin\(user\)\) redirect/);
  assert.match(dashboardShell, /href: '\/admin\/gyms'/);
  assert.match(dashboardShell, /const links = isSuperadmin \? adminNav/);
  const detailPage = await readFile(fileURLToPath(new URL("../app/(dashboard)/admin/gyms/[id]/page.js", import.meta.url)), "utf8");
  const detailComponent = await readFile(fileURLToPath(new URL("../components/admin/admin-gym-details.js", import.meta.url)), "utf8");
  const gymList = await readFile(fileURLToPath(new URL("../components/admin/admin-gym-manager.js", import.meta.url)), "utf8");
  assert.match(detailPage, /if \(!isSuperadmin\(user\)\) redirect/);
  assert.match(gymList, /href=\{`\/admin\/gyms\/\$\{encodeURIComponent\(gym\.id\)\}`\}/);
  assert.match(gymList, /Initial SaaS access/);
  assert.match(gymList, /access remains paused until a SaaS plan or trial is assigned/);
  assert.match(detailComponent, /Loading gym details/);
  assert.match(detailComponent, /gym account was not found/);
  assert.match(detailComponent, /import ErrorState/);
  assert.match(detailComponent, /<ErrorState/);
  assert.match(detailComponent, /No active owner assigned/);
  assert.match(detailComponent, /Fitivo subscription/);
  assert.match(detailComponent, /Issue plan invoice/);
  assert.match(detailComponent, /Create renewal invoice/);
  assert.match(detailComponent, /Pending payment/);
  assert.match(detailComponent, /Pending invoice blocks another plan change/);
  assert.match(detailComponent, /View invoice/);
  assert.match(detailComponent, /Reconcile verified payment/);
  assert.match(detailComponent, /Void invoice/);
  assert.match(detailComponent, /I independently verified full payment in the receiving account/);
  assert.match(detailComponent, /Reason for voiding/);
  assert.match(detailComponent, /pendingInvoiceId/);
  assert.match(detailComponent, /Back to gyms/i);
});
