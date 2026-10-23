import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { GET } from "../app/api/reports/route.js";
import { buildGymReport, buildMembershipStatusDistribution, getGymReportMonths } from "../lib/reportRules.js";

test("report windows cover six calendar months using the Gym timezone", () => {
  const months = getGymReportMonths(new Date("2026-10-20T20:30:00Z"), "Asia/Karachi");
  assert.deepEqual(months.map(({ month }) => month), ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]);
  assert.equal(months[0].start.toISOString(), "2026-05-01T00:00:00.000Z");
  assert.equal(months[5].nextMonth, "2026-11");
  assert.equal(months.reduce((sum, item) => sum + item.days, 0), 174);
  assert.throws(() => getGymReportMonths(new Date(), "UTC", 25), /between 1 and 24/);
});

test("report summary totals payment, member, and attendance aggregates without inventing activity", () => {
  const monthWindows = getGymReportMonths(new Date("2026-10-20T00:00:00Z"), "UTC", 2);
  const result = buildGymReport({
    monthWindows,
    payments: [{ _id: monthWindows[0].month, total: 3000 }],
    members: [{ _id: monthWindows[1].month, count: 2 }],
    attendance: [{ _id: monthWindows[0].month, count: 31 }],
    activeSubscriptions: 4,
    membershipStatuses: [{ _id: "active", count: 3 }, { _id: "expired", count: 2 }],
  });
  assert.equal(result.months.length, 2);
  assert.equal(result.summary.paymentCollected, 3000);
  assert.equal(result.summary.newMembers, 2);
  assert.equal(result.summary.activeSubscriptions, 4);
  assert.equal(result.summary.averageAttendancePerDay, 0.6);
  assert.deepEqual(result.summary.membershipStatuses, { active: 3, expiring: 0, upcoming: 0, expired: 2, cancelled: 0 });
  assert.equal(result.months[1].attendanceCount, 0);
});

test("membership status distribution fills empty states and ignores unsupported database buckets", () => {
  assert.deepEqual(buildMembershipStatusDistribution([{ _id: "upcoming", count: 2 }, { _id: "legacy", count: 50 }]), {
    active: 0, expiring: 0, upcoming: 2, expired: 0, cancelled: 0,
  });
});

test("reports API rejects unauthenticated access and aggregates only the trusted gym", async () => {
  const response = await GET(new Request("http://localhost/api/reports"));
  assert.equal(response.status, 401);
  const source = await readFile(fileURLToPath(new URL("../app/api/reports/route.js", import.meta.url)), "utf8");
  assert.match(source, /requireApiUser\(request\)/);
  assert.match(source, /getRequestGymId\(request\)/);
  assert.match(source, /Payment\.aggregate/);
  assert.match(source, /Member\.aggregate/);
  assert.match(source, /Attendance\.aggregate/);
  assert.match(source, /\$facet/);
  assert.match(source, /membershipCancelled/);
  assert.match(source, /gymId \}/);
  assert.match(source, /\$lte: \["\$expiryDate", expiringThrough\]/);
  assert.match(source, /Subscription\.countDocuments\(\{ gymId, status: \{ \$ne: "cancelled" \}/);
  assert.doesNotMatch(source, /request\.json|searchParams\.get\("gymId"\)/);
});

test("Owner reports load real metrics, expose states, and navigation includes reports and settings", async () => {
  const page = await readFile(fileURLToPath(new URL("../app/(dashboard)/reports/page.js", import.meta.url)), "utf8");
  const manager = await readFile(fileURLToPath(new URL("../components/reports/reports-manager.js", import.meta.url)), "utf8");
  const dashboard = await readFile(fileURLToPath(new URL("../components/dashboard/owner-dashboard-analytics.js", import.meta.url)), "utf8");
  const settingsPage = await readFile(fileURLToPath(new URL("../app/(dashboard)/settings/page.js", import.meta.url)), "utf8");
  const settingsManager = await readFile(fileURLToPath(new URL("../components/settings/gym-settings.js", import.meta.url)), "utf8");
  const shell = await readFile(fileURLToPath(new URL("../components/layout/dashboard-shell.js", import.meta.url)), "utf8");
  assert.match(page, /ReportsManager/);
  assert.match(manager, /\/api\/reports/);
  assert.match(manager, /Loading reports/);
  assert.match(manager, /role="alert"/);
  assert.match(dashboard, /\/api\/reports/);
  assert.match(dashboard, /title="Revenue"/);
  assert.match(dashboard, /label="Active memberships"/);
  assert.match(dashboard, /label="Today's check-ins"/);
  assert.match(dashboard, /<ErrorState[^>]*onRetry=\{report.retry\}/);
  assert.match(settingsPage, /GymSettings/);
  assert.match(settingsManager, /\/api\/gym\/settings/);
  assert.match(settingsManager, /Gym settings saved/);
  assert.match(settingsManager, /role="status"/);
  assert.match(shell, /href: '\/reports'/);
  assert.match(shell, /href: '\/settings'/);
});
