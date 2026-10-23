import { addDays, gymToday, resolveGymTimezone } from "./subscriptionRules.js";
import { gymDateStartUtc } from "./reportRules.js";

export function compareKpiPeriods(current, previous) {
  const difference = current - previous;
  return {
    current, previous, difference,
    direction: difference > 0 ? "up" : difference < 0 ? "down" : "neutral",
    percent: previous > 0 ? Math.round(difference / previous * 1000) / 10 : current === 0 ? 0 : null,
  };
}

// Reuse the report's daily MongoDB aggregates. Compare two complete seven-day
// windows; today's partial activity is deliberately excluded from both.
export function buildSignupKpi(rows, today) {
  const byDay = new Map();
  for (const row of rows) {
    if (typeof row?._id !== "string" || !Number.isFinite(row.count) || row.count < 0) continue;
    byDay.set(row._id, (byDay.get(row._id) || 0) + row.count);
  }
  const series = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 7);
    return { date, count: byDay.get(date) || 0 };
  });
  const previous = Array.from({ length: 7 }, (_, index) => byDay.get(addDays(today, index - 14)) || 0)
    .reduce((sum, value) => sum + value, 0);
  return {
    series,
    startDate: addDays(today, -7), endDate: addDays(today, -1),
    previousStartDate: addDays(today, -14), previousEndDate: addDays(today, -8),
    comparison: compareKpiPeriods(series.reduce((sum, point) => sum + point.count, 0), previous),
  };
}

export function attendanceKpiWindow(now = new Date(), timezone) {
  const zone = resolveGymTimezone(timezone);
  const today = gymToday(now, zone);
  const yesterday = addDays(today, -1);
  const todayStart = gymDateStartUtc(today, zone);
  const yesterdayStart = gymDateStartUtc(yesterday, zone);
  const elapsed = now.getTime() - todayStart.getTime();
  // On a long DST day, yesterday may not contain an equally long interval.
  // Report no comparison instead of comparing unequal observation windows.
  const comparable = elapsed < todayStart.getTime() - yesterdayStart.getTime();
  return { today, yesterday, weekStart: addDays(today, -6), timezone: zone, now,
    todayStart, yesterdayStart, yesterdayCutoff: new Date(yesterdayStart.getTime() + elapsed), comparable };
}

export function buildAttendanceKpi(rows, window) {
  const byDay = new Map();
  for (const row of rows) {
    if (typeof row?._id !== "string") continue;
    const current = byDay.get(row._id) || { _id: row._id, count: 0, inside: 0, elapsedCount: 0 };
    for (const key of ["count", "inside", "elapsedCount"]) {
      if (Number.isFinite(row[key]) && row[key] >= 0) current[key] += row[key];
    }
    byDay.set(row._id, current);
  }
  const checkedInToday = byDay.get(window.today)?.count || 0;
  const history = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(window.weekStart, index);
    return { date, count: byDay.get(date)?.count || 0 };
  });
  return {
    date: window.today, timeZone: window.timezone,
    checkedInToday, currentlyInside: byDay.get(window.today)?.inside || 0,
    averageCheckInsThisWeek: Math.round(history.reduce((sum, day) => sum + day.count, 0) / 7 * 10) / 10,
    history, asOf: window.now.toISOString(),
    comparison: window.comparable ? {
      ...compareKpiPeriods(checkedInToday, byDay.get(window.yesterday)?.elapsedCount || 0),
      previousDate: window.yesterday, previousCutoff: window.yesterdayCutoff.toISOString(),
    } : null,
  };
}

// Preserve the existing dues definition: sum only positive member balances.
// These bars describe today's balances, never a fictional balance history.
export function summarizeDuesKpi(entries = []) {
  const outstanding = entries.filter(({ balance }) => Number.isFinite(balance) && balance > 0);
  return {
    total: outstanding.reduce((sum, entry) => sum + entry.balance, 0),
    memberCount: outstanding.length,
    largest: [...outstanding].sort((a, b) => b.balance - a.balance).slice(0, 5),
  };
}
