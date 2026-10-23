import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { GET as getOverview } from "../app/api/admin/overview/route.js";
import { isSuperadmin } from "../lib/adminUserRules.js";
import { buildPlatformAnalytics, getPlatformAnalyticsMonths } from "../lib/adminAnalyticsRules.js";

test("platform overview API rejects unauthenticated requests before reading platform data", async () => {
  const response = await getOverview(new Request("http://localhost/api/admin/overview"));
  assert.equal(response.status, 401);
});

test("platform overview uses supported superadmin roles and only aggregate Gym/account counts", async () => {
  const route = await readFile(fileURLToPath(new URL("../app/api/admin/overview/route.js", import.meta.url)), "utf8");
  const page = await readFile(fileURLToPath(new URL("../app/(dashboard)/admin/page.js", import.meta.url)), "utf8");
  const component = await readFile(fileURLToPath(new URL("../components/admin/admin-overview.js", import.meta.url)), "utf8");
  const errorState = await readFile(fileURLToPath(new URL("../components/ui/error-state.js", import.meta.url)), "utf8");
  const shell = await readFile(fileURLToPath(new URL("../components/layout/dashboard-shell.js", import.meta.url)), "utf8");
  const dashboard = await readFile(fileURLToPath(new URL("../app/(dashboard)/dashboard/page.js", import.meta.url)), "utf8");

  assert.match(route, /await requireSuperadminUser\(request\)/);
  assert.match(route, /Gym\.countDocuments\(\{ status: "active" \}\)/);
  assert.match(route, /Gym\.countDocuments\(\{ status: "suspended" \}\)/);
  assert.match(route, /User\.countDocuments\(\{ isActive: \{ \$ne: false \} \}\)/);
  assert.match(route, /User\.countDocuments\(\{ isActive: false \}\)/);
  assert.match(route, /PlatformInvoice\.countDocuments\(\{ status: "open" \}\)/);
  assert.match(route, /User\.distinct\("_id", \{ role: "staff", isActive: \{ \$ne: false \} \}\)/);
  assert.match(route, /gymsWithoutOwner/);
  assert.match(route, /restrictedSaaSGyms/);
  assert.match(route, /role: \{ \$in: \["superadmin", "platform_super_admin"\] \}/);
  assert.doesNotMatch(route, /Member\.countDocuments|Payment\.(?:countDocuments|aggregate)|Attendance\.(?:countDocuments|aggregate)/);
  assert.match(page, /if \(!isSuperadmin\(user\)\) redirect\("\/dashboard"\)/);
  assert.match(component, /import ErrorState/);
  assert.match(component, /<ErrorState/);
  assert.match(errorState, /role="alert"/);
  assert.match(errorState, /Try again/);
  assert.match(component, /Loading platform counts/);
  assert.match(component, /No Gym workspaces have been registered yet/);
  assert.match(component, /Superadmin accounts/);
  assert.match(component, /SaaS subscription status/);
  assert.match(component, /Fitivo invoices and collections/);
  assert.match(component, /Gym onboarding/);
  assert.match(shell, /const adminNav = \[/);
  assert.match(shell, /href: '\/admin\/gyms'/);
  assert.match(shell, /href: '\/admin\/users'/);
  assert.match(shell, /const profileHref = isSuperadmin \? '\/admin\/users' : isTrainer \? '\/trainer' : canManageStaff \? '\/profile'/);
  assert.match(shell, /href=\{profileHref\}/);
  assert.match(shell, /function isActive\(pathname, href\)/);
  assert.match(shell, /href !== '\/admin' && pathname\.startsWith\(`\$\{href\}\//);
  assert.match(dashboard, /if \(isSuperadmin\(user\)\) redirect\("\/admin"\)/);
  assert.equal(isSuperadmin({ role: "superadmin" }), true);
  assert.equal(isSuperadmin({ role: "platform_super_admin" }), true);
  assert.equal(isSuperadmin({ role: "gym_owner" }), false);
});

test("platform analytics separates Gym SaaS invoices from manually verified collections", () => {
  const monthWindows = getPlatformAnalyticsMonths(new Date("2026-10-20T12:00:00.000Z"));
  assert.deepEqual(monthWindows.map(({ month }) => month), ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]);
  const analytics = buildPlatformAnalytics({
    monthWindows,
    gymStatuses: [{ _id: "active", count: 3 }],
    saasStatuses: [{ _id: "active", count: 2 }, { _id: "expired", count: 1 }],
    onboarding: [{ _id: "2026-10", count: 2 }],
    invoiceTrends: [{ _id: "2026-10", invoiced: 18000, collected: 12000 }],
  });
  assert.deepEqual(analytics.gymStatus, { active: 3, suspended: 0 });
  assert.deepEqual(analytics.saasStatus, { trialing: 0, active: 2, past_due: 0, expired: 1, cancelled: 0, unconfigured: 0 });
  assert.deepEqual(analytics.months[5], { month: "2026-10", gymsOnboarded: 2, invoiced: 18000, collected: 12000 });
  assert.equal(analytics.months[0].collected, 0);
});

test("Superadmin analytics requires platform authorization and counts collection only from paid reconciled invoices", async () => {
  const route = await readFile(fileURLToPath(new URL("../app/api/admin/overview/route.js", import.meta.url)), "utf8");
  assert.match(route, /await requireSuperadminUser\(request\)/);
  assert.match(route, /PlatformInvoice\.aggregate/);
  assert.match(route, /status: "paid", paidAt:/);
  assert.match(route, /\$sum: "\$amountDue"/);
  assert.match(route, /saasSubscription\.periodEnd/);
  assert.match(route, /Gym\.aggregate\(\[\{ \$facet:/);
});
