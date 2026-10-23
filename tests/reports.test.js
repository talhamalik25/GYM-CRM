import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { GET } from "../app/api/reports/route.js";
import { buildGymReport, buildGymReportAnalytics, buildMembershipStatusDistribution, formatReportCurrency, getGymReportMonths, gymDateStartUtc, resolveGymReportRange } from "../lib/reportRules.js";

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

test("report filters resolve gym-local presets and bound custom ranges", () => {
  const now = new Date("2026-10-20T20:30:00Z");
  const preset = resolveGymReportRange({ range: "7d" }, now, "Asia/Karachi");
  assert.equal(preset.data.startDate, "2026-10-15");
  assert.equal(preset.data.endDate, "2026-10-21");
  assert.equal(preset.data.days, 7);
  assert.equal(preset.data.granularity, "day");
  assert.equal(preset.data.previousStartDate, "2026-10-08");
  assert.equal(resolveGymReportRange({ range: "custom", startDate: "2025-01-01", endDate: "2026-10-21" }, now, "Asia/Karachi").error, "Reports can cover up to 366 calendar days.");
  assert.match(resolveGymReportRange({ range: "custom", startDate: "2026-10-01", endDate: "2026-10-22" }, now, "Asia/Karachi").error, /future/);
  assert.match(resolveGymReportRange({ range: "custom", startDate: "2026-10-10", endDate: "2026-10-01" }, now, "Asia/Karachi").error, /on or before/);
  assert.match(resolveGymReportRange({ range: "30y" }, now, "Asia/Karachi").error, /supported/);
});

test("gym-local date bounds account for daylight saving time", () => {
  assert.equal(gymDateStartUtc("2026-03-08", "America/New_York").toISOString(), "2026-03-08T05:00:00.000Z");
  assert.equal(gymDateStartUtc("2026-03-09", "America/New_York").toISOString(), "2026-03-09T04:00:00.000Z");
});

test("report ranges include the requested twelve-month window and currency formats in PKR", () => {
  const annual = resolveGymReportRange({ range: "12m" }, new Date("2026-10-20T20:30:00Z"), "Asia/Karachi");
  assert.equal(annual.data.days, 355);
  assert.equal(annual.data.granularity, "month");
  assert.equal(formatReportCurrency(125000), "PKR 125,000");
  assert.equal(formatReportCurrency(0), "PKR 0");
});

test("filtered analytics aggregate real daily rows into buckets and compare equal prior periods", () => {
  const period = {
    range: "custom", startDate: "2026-10-01", endDate: "2026-10-03",
    previousStartDate: "2026-09-28", previousEndDate: "2026-09-30",
    days: 3, granularity: "day", timezone: "UTC", today: "2026-10-03",
  };
  const report = buildGymReportAnalytics({
    period,
    payments: [{ _id: "2026-10-01", total: 1000 }, { _id: "2026-09-28", total: 500 }],
    members: [{ _id: "2026-10-02", count: 2 }, { _id: "2026-09-29", count: 1 }],
    attendance: [{ _id: "2026-10-01", count: 6 }, { _id: "2026-09-28", count: 3 }],
    renewals: [{ _id: "2026-10-03", count: 1 }, { _id: "2026-09-28", count: 2 }],
    totalMembers: 20,
    activeSubscriptions: 8,
    membershipStatuses: [{ _id: "active", count: 5 }, { _id: "expiring", count: 2 }, { _id: "expired", count: 4 }],
  });
  assert.deepEqual(report.series.map(({ key }) => key), ["2026-10-01", "2026-10-02", "2026-10-03"]);
  assert.deepEqual(report.series.map(({ tooltipLabel }) => tooltipLabel), [
    "1 Oct 2026", "2 Oct 2026", "3 Oct 2026",
  ]);
  assert.deepEqual(report.attendanceDays, [
    { date: "2026-10-01", count: 6 },
    { date: "2026-10-02", count: 0 },
    { date: "2026-10-03", count: 0 },
  ]);
  assert.equal(report.summary.paymentCollected, 1000);
  assert.equal(report.summary.newMembers, 2);
  assert.equal(report.summary.attendanceCount, 6);
  assert.equal(report.summary.renewals, 1);
  assert.equal(report.summary.averageAttendancePerDay, 2);
  assert.equal(report.summary.activeMemberships, 7);
  assert.equal(report.summary.totalMembers, 20);
  assert.equal(report.summary.attendanceRate, null);
  assert.equal(report.summary.periodComparison.paymentCollected, 500);
  assert.equal(report.summary.periodComparison.paymentCollectedChangePercent, 100);
  assert.equal(report.summary.periodComparison.newMembersChangePercent, 100);
  assert.equal(report.summary.periodComparison.renewals, 2);
  assert.deepEqual(report.summary.membershipStatuses, { active: 5, expiring: 2, upcoming: 0, expired: 4, cancelled: 0 });
});

test("weekly report buckets start on Monday and retain partial boundary weeks", () => {
  const report = buildGymReportAnalytics({
    period: {
      range: "custom", startDate: "2026-10-04", endDate: "2026-10-06",
      previousStartDate: "2026-10-01", previousEndDate: "2026-10-03",
      days: 3, granularity: "week", timezone: "UTC", today: "2026-10-06",
    },
    attendance: [{ _id: "2026-10-04", count: 2 }, { _id: "2026-10-06", count: 5 }],
  });
  assert.deepEqual(report.series.map(({ key }) => key), ["2026-09-28", "2026-10-05"]);
  assert.deepEqual(report.series.map(({ attendanceCount }) => attendanceCount), [2, 5]);
  assert.deepEqual(report.series.map(({ tooltipLabel }) => tooltipLabel), ["4 Oct 2026", "5 Oct 2026 – 6 Oct 2026"]);
});

test("reports API rejects unauthenticated access and aggregates only the trusted gym", async () => {
  const response = await GET(new Request("http://localhost/api/reports"));
  assert.equal(response.status, 401);
  const source = await readFile(fileURLToPath(new URL("../app/api/reports/route.js", import.meta.url)), "utf8");
  assert.match(source, /import \{ addDays, dateOnly \} from "\.\.\/\.\.\/\.\.\/lib\/subscriptionRules\.js"/);
  assert.match(source, /requireApiUser\(request\)/);
  assert.match(source, /getRequestGymId\(request\)/);
  assert.match(source, /Payment\.aggregate/);
  assert.match(source, /Member\.aggregate/);
  assert.match(source, /Attendance\.aggregate/);
  assert.match(source, /Payment\.aggregate\(\[\s*\{ \$match: \{ gymId,/);
  assert.match(source, /Attendance\.aggregate\(\[\s*\{ \$match: \{ gymId,/);
  assert.match(source, /\$facet/);
  assert.match(source, /membershipCancelled/);
  assert.match(source, /paymentDate: \{ \$gte: paymentsStart, \$lt: paymentsEnd \}/);
  assert.match(source, /date: "\$paymentDate", timezone: period\.timezone/);
  assert.match(source, /gymId \}/);
  assert.match(source, /\$lte: \["\$expiryDate", expiringThrough\]/);
  assert.match(source, /Subscription\.countDocuments\(\{ gymId, status: \{ \$ne: "cancelled" \}/);
  assert.match(source, /Subscription\.aggregate\(\[\s*\{ \$match: \{ gymId, "renewalHistory\.createdAt": \{ \$gte: memberStart, \$lt: memberEnd \} \} \}/);
  assert.match(source, /renewalHistory\.renewalKey", "\$createKey/);
  assert.doesNotMatch(source, /request\.json|searchParams\.get\("gymId"\)/);
});

test("Owner reports load real metrics, expose states, and navigation includes reports and settings", async () => {
  const page = await readFile(fileURLToPath(new URL("../app/(dashboard)/reports/page.js", import.meta.url)), "utf8");
  const manager = await readFile(fileURLToPath(new URL("../components/reports/reports-manager.js", import.meta.url)), "utf8");
  const styles = await readFile(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");
  const dashboard = await readFile(fileURLToPath(new URL("../components/dashboard/owner-dashboard-analytics.js", import.meta.url)), "utf8");
  const settingsPage = await readFile(fileURLToPath(new URL("../app/(dashboard)/settings/page.js", import.meta.url)), "utf8");
  const settingsManager = await readFile(fileURLToPath(new URL("../components/settings/gym-settings.js", import.meta.url)), "utf8");
  const shell = await readFile(fileURLToPath(new URL("../components/layout/dashboard-shell.js", import.meta.url)), "utf8");
  assert.match(page, /ReportsManager/);
  assert.match(manager, /\/api\/reports/);
  assert.match(manager, /loadingLabel="member payment collections"/);
  assert.match(manager, /range: "30d"/);
  assert.match(manager, /title="Reports & Analytics"/);
  assert.doesNotMatch(manager, /<section className="reports-kpis"/);
  assert.match(manager, /<Bar dataKey="paymentCollected"/);
  assert.match(manager, /value: "PKR"/);
  assert.match(manager, /value: "Check-ins"/);
  assert.match(manager, /Period/);
  assert.match(manager, /tooltipLabel/);
  assert.match(manager, /As of \$\{asOf/);
  assert.match(manager, /Last 7 Days/);
  assert.match(manager, /Last 30 Days/);
  assert.match(manager, /Last 90 Days/);
  assert.match(manager, /Last 12 Months/);
  assert.match(styles, /\.reports-chart-grid \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 760px\) \{\s+\.reports-chart-grid \{ grid-template-columns: minmax\(0, 1fr\);/);
  assert.match(manager, /schedule baseline is stored for an attendance rate/);
  assert.match(manager, /Membership status/);
  assert.match(manager, /role="alert"/);
  assert.match(dashboard, /\/api\/reports/);
  assert.match(dashboard, /title="Revenue"/);
  assert.match(dashboard, /label="Active memberships"/);
  assert.match(dashboard, /label="Today's check-ins"/);
  assert.match(dashboard, /buildDashboardTimeSeries\(signupKpi\?\.series/);
  assert.match(dashboard, /buildDashboardTimeSeries\(attendance\.data\?\.history/);
  assert.match(dashboard, /buildDuesChart\(members\)/);
  assert.match(dashboard, /MembershipRing active=\{report\.data\?\.summary\.activeSubscriptions/);
  assert.match(dashboard, /<ErrorState[^>]*onRetry=\{report.retry\}/);
  const reportsRoute = await readFile(fileURLToPath(new URL("../app/api/reports/route.js", import.meta.url)), "utf8");
  assert.match(reportsRoute, /dashboardSignups/);
  assert.match(reportsRoute, /isActive: \{ \$ne: false \}, createdAt: \{ \$gte: dashboardSignupStart, \$lt: dashboardTodayStart \}/);
  assert.match(reportsRoute, /buildSignupKpi\(members\.dashboardSignups \|\| \[\], today\)/);
  assert.match(settingsPage, /GymSettings/);
  assert.match(settingsManager, /\/api\/gym\/settings/);
  assert.match(settingsManager, /Gym settings saved/);
  assert.match(settingsManager, /role="status"/);
  assert.match(shell, /href: '\/reports'/);
  assert.match(shell, /href: '\/settings'/);
});
