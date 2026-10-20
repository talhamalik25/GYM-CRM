import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { GET as getOverview } from "../app/api/admin/overview/route.js";
import { isSuperadmin } from "../lib/adminUserRules.js";

test("platform overview API rejects unauthenticated requests before reading platform data", async () => {
  const response = await getOverview(new Request("http://localhost/api/admin/overview"));
  assert.equal(response.status, 401);
});

test("platform overview uses supported superadmin roles and only aggregate Gym/account counts", async () => {
  const route = await readFile(fileURLToPath(new URL("../app/api/admin/overview/route.js", import.meta.url)), "utf8");
  const page = await readFile(fileURLToPath(new URL("../app/(dashboard)/admin/page.js", import.meta.url)), "utf8");
  const component = await readFile(fileURLToPath(new URL("../components/admin/admin-overview.js", import.meta.url)), "utf8");
  const shell = await readFile(fileURLToPath(new URL("../components/layout/dashboard-shell.js", import.meta.url)), "utf8");
  const dashboard = await readFile(fileURLToPath(new URL("../app/(dashboard)/dashboard/page.js", import.meta.url)), "utf8");

  assert.match(route, /await requireSuperadminUser\(request\)/);
  assert.match(route, /Gym\.countDocuments\(\{ status: "active" \}\)/);
  assert.match(route, /Gym\.countDocuments\(\{ status: "suspended" \}\)/);
  assert.match(route, /User\.countDocuments\(\{ isActive: true \}\)/);
  assert.match(route, /User\.countDocuments\(\{ isActive: false \}\)/);
  assert.match(route, /role: \{ \$in: \["superadmin", "platform_super_admin"\] \}/);
  assert.doesNotMatch(route, /Member|Payment|Subscription|Attendance/);
  assert.match(page, /if \(!isSuperadmin\(user\)\) redirect\("\/dashboard"\)/);
  assert.match(component, /role="alert"/);
  assert.match(component, /Loading platform counts/);
  assert.match(component, /No Gym workspaces have been registered yet/);
  assert.match(component, /Superadmin accounts/);
  assert.match(shell, /const adminNav = \[/);
  assert.match(shell, /href: '\/admin\/gyms'/);
  assert.match(shell, /href: '\/admin\/users'/);
  assert.match(shell, /pathname\.startsWith\('\/admin\/gyms'\)/);
  assert.match(dashboard, /if \(isSuperadmin\(user\)\) redirect\("\/admin"\)/);
  assert.equal(isSuperadmin({ role: "superadmin" }), true);
  assert.equal(isSuperadmin({ role: "platform_super_admin" }), true);
  assert.equal(isSuperadmin({ role: "gym_owner" }), false);
});
