import test from "node:test";
import assert from "node:assert/strict";
import { buildAttendanceKpi, attendanceKpiWindow, buildSignupKpi } from "../lib/dashboardKpiRules.js";
import { buildDashboardTimeSeries, buildDuesChart } from "../lib/dashboardChartRules.js";

test("time-series chart transform sorts dates and retains real zero buckets", () => {
  const points = buildDashboardTimeSeries([
    { date: "2026-10-20", count: 7 },
    { date: "2026-10-18", count: 0 },
    { date: "2026-10-19", count: 3 },
  ], { unit: "members" });

  assert.deepEqual(points.map(({ key, value }) => [key, value]), [
    ["2026-10-18", 0], ["2026-10-19", 3], ["2026-10-20", 7],
  ]);
  assert.equal(points[0].heightPercent, 0);
  assert.equal(points[1].heightPercent, 3 / 7 * 100);
  assert.match(points[1].tooltip, /3 members/);
  assert.match(points[0].label, /18/);
});

test("time-series chart transform handles empty, single, all-zero, duplicate, and very large values", () => {
  assert.deepEqual(buildDashboardTimeSeries([]), []);
  const single = buildDashboardTimeSeries([{ date: "2026-10-23", count: 8_000_000 }]);
  assert.equal(single.length, 1);
  assert.equal(single[0].heightPercent, 100);
  const zeros = buildDashboardTimeSeries([
    { date: "2026-10-22", count: 0 }, { date: "2026-10-23", count: 0 },
  ]);
  assert.deepEqual(zeros.map(({ heightPercent }) => heightPercent), [0, 0]);
  const duplicate = buildDashboardTimeSeries([
    { date: "2026-10-23", count: 2 }, { date: "2026-10-23", count: 4 },
  ]);
  assert.equal(duplicate.length, 1);
  assert.equal(duplicate[0].value, 6);
  assert.deepEqual(buildDashboardTimeSeries([
    { date: "2026-02-30", count: 2 }, { date: "2026-10-23", count: -1 }, { date: "2026-10-23", count: NaN },
  ]), []);
});

test("dues chart groups the exact all-member total into top balances plus an accurate remainder", () => {
  const entries = [
    { memberName: "E", balance: 100 }, { memberName: "B", balance: 500 },
    { memberName: "D", balance: 200 }, { memberName: "A", balance: 900 },
    { memberName: "C", balance: 300 }, { memberName: "No dues", balance: 0 },
  ];
  const points = buildDuesChart(entries);
  assert.deepEqual(points.map(({ label }) => label), ["A", "B", "C", "D", "Other members"]);
  assert.equal(points.reduce((sum, point) => sum + point.value, 0), 2_000);
  assert.equal(points.at(-1).value, 100);
  assert.match(points[0].tooltip, /PKR 900/);
  assert.deepEqual(buildDuesChart([]), []);
  assert.deepEqual(buildDuesChart([{ memberName: "Only", balance: 4 }]).map(({ value }) => value), [4]);
});

test("signup and attendance chart aggregates retain seven ordered gym-local dates and zeroes", () => {
  const signup = buildSignupKpi([
    { _id: "2026-10-22", count: 4 }, { _id: "2026-10-18", count: 0 },
  ], "2026-10-23");
  assert.deepEqual(signup.series.map(({ date }) => date), [
    "2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22",
  ]);
  assert.equal(signup.series[2].count, 0);
  assert.equal(signup.series[6].count, 4);
  assert.equal(signup.comparison.current, 4);

  const window = attendanceKpiWindow(new Date("2026-10-23T05:00:00.000Z"), "Asia/Karachi");
  const attendance = buildAttendanceKpi([{ _id: window.today, count: 0, inside: 0 }], window);
  assert.deepEqual(attendance.history.map(({ date }) => date), [
    "2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23",
  ]);
  assert.equal(attendance.history.at(-1).count, 0);
  assert.equal(attendance.timeZone, "Asia/Karachi");
});
