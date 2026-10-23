import { addDays, dateOnly, gymToday, isDateOnly, resolveGymTimezone } from "./subscriptionRules.js";

const DAY_MS = 86400000;

export function formatReportCurrency(value) {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `PKR ${amount.toLocaleString("en-PK")}`;
}
const REPORT_RANGES = new Set(["7d", "30d", "90d", "6m", "12m", "custom"]);
const REPORT_GRANULARITIES = new Set(["day", "week", "month"]);

export function getGymReportMonths(now = new Date(), timezone = "Asia/Karachi", count = 6) {
  if (!Number.isSafeInteger(count) || count < 1 || count > 24) throw new RangeError("Report month count must be between 1 and 24.");
  const today = gymToday(now, timezone);
  const [year, month] = today.split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const offset = index - count + 1;
    const startDate = new Date(Date.UTC(year, month - 1 + offset, 1));
    const endDate = new Date(Date.UTC(year, month + offset, 1));
    const monthKey = startDate.toISOString().slice(0, 7);
    return {
      month: monthKey,
      start: startDate,
      end: endDate,
      nextMonth: endDate.toISOString().slice(0, 7),
      days: monthKey === today.slice(0, 7)
        ? Number(today.slice(8, 10))
        : (endDate.getTime() - startDate.getTime()) / 86400000,
    };
  });
}

export function buildMembershipStatusDistribution(items = []) {
  const counts = { active: 0, expiring: 0, upcoming: 0, expired: 0, cancelled: 0 };
  for (const item of items) {
    if (Object.hasOwn(counts, item._id)) counts[item._id] = item.count;
  }
  return counts;
}

export function buildGymReport({ monthWindows, payments = [], members = [], attendance = [], activeSubscriptions = 0, membershipStatuses = [] }) {
  const indexed = (items) => new Map(items.map((item) => [item._id, item]));
  const paymentsByMonth = indexed(payments);
  const membersByMonth = indexed(members);
  const attendanceByMonth = indexed(attendance);
  const months = monthWindows.map(({ month, days }) => ({
    month,
    days,
    paymentCollected: paymentsByMonth.get(month)?.total || 0,
    newMembers: membersByMonth.get(month)?.count || 0,
    attendanceCount: attendanceByMonth.get(month)?.count || 0,
  }));
  const days = months.reduce((total, item) => total + item.days, 0);
  const attendanceCount = months.reduce((total, item) => total + item.attendanceCount, 0);
  return {
    months: months.map(({ days: _days, ...item }) => item),
    summary: {
      paymentCollected: months.reduce((total, item) => total + item.paymentCollected, 0),
      newMembers: months.reduce((total, item) => total + item.newMembers, 0),
      averageAttendancePerDay: days ? Math.round((attendanceCount / days) * 10) / 10 : 0,
      activeSubscriptions,
      membershipStatuses: buildMembershipStatusDistribution(membershipStatuses),
    },
  };
}

function dateString(date) {
  return date.toISOString().slice(0, 10);
}

function monthStartOffset(today, offset) {
  const [year, month] = today.split("-").map(Number);
  return dateString(new Date(Date.UTC(year, month - 1 + offset, 1)));
}

function dateDifference(startDate, endDate) {
  return Math.round((dateOnly(endDate).getTime() - dateOnly(startDate).getTime()) / DAY_MS);
}

function chooseGranularity(range, days) {
  if (range === "6m" || range === "12m") return "month";
  if (range === "90d") return "week";
  if (range === "custom") return days <= 45 ? "day" : days <= 180 ? "week" : "month";
  return "day";
}

/** Resolve a bounded date range from the gym's calendar, never the host timezone. */
export function resolveGymReportRange({ range = "6m", startDate = "", endDate = "", granularity = "" } = {}, now = new Date(), timezone = "Asia/Karachi") {
  if (!REPORT_RANGES.has(range)) return { error: "Choose a supported report period." };
  const resolvedTimezone = resolveGymTimezone(timezone);
  const today = gymToday(now, resolvedTimezone);
  let start;
  let end = today;

  if (range === "custom") {
    if (!isDateOnly(startDate) || !isDateOnly(endDate)) return { error: "Enter a valid start and end date." };
    start = startDate;
    end = endDate;
    if (start > end) return { error: "The start date must be on or before the end date." };
    if (end > today) return { error: "The end date cannot be in the future." };
  } else if (range === "7d" || range === "30d" || range === "90d") {
    const days = Number(range.slice(0, -1));
    start = addDays(today, -(days - 1));
  } else {
    start = monthStartOffset(today, range === "6m" ? -5 : -11);
  }

  const days = dateDifference(start, end) + 1;
  if (days < 1 || days > 366) return { error: "Reports can cover up to 366 calendar days." };
  if (granularity && !REPORT_GRANULARITIES.has(granularity)) return { error: "Choose a supported chart interval." };

  const previousEnd = addDays(start, -1);
  const previousStart = addDays(previousEnd, -(days - 1));
  return {
    data: {
      range,
      startDate: start,
      endDate: end,
      previousStartDate: previousStart,
      previousEndDate: previousEnd,
      days,
      granularity: granularity || chooseGranularity(range, days),
      timezone: resolvedTimezone,
      today,
    },
  };
}

/** Convert gym-local midnight to its UTC instant, including daylight-saving offsets. */
export function gymDateStartUtc(value, timezone) {
  if (!isDateOnly(value)) throw new RangeError("Expected a valid YYYY-MM-DD date.");
  const zone = resolveGymTimezone(timezone);
  const [year, month, day] = value.split("-").map(Number);
  const target = Date.UTC(year, month - 1, day);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  let guess = target;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(guess)).map(({ type, value: part }) => [type, part]));
    const represented = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
    const adjustment = target - represented;
    if (adjustment === 0) return new Date(guess);
    guess += adjustment;
  }
  return new Date(guess);
}

function dayKeyForGranularity(day, granularity) {
  if (granularity === "month") return day.slice(0, 7);
  if (granularity === "week") {
    const date = dateOnly(day);
    const weekday = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() - weekday + 1);
    return dateString(date);
  }
  return day;
}

function bucketLabel(key, granularity, rangeStart, rangeEnd) {
  if (granularity === "month") {
    const [year, month] = key.split("-").map(Number);
    return new Intl.DateTimeFormat("en-PK", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
  }
  const date = dateOnly(key);
  if (granularity === "week") {
    const weekStart = key < rangeStart ? dateOnly(rangeStart) : date;
    const weekEnd = new Date(date.getTime() + 6 * DAY_MS);
    const rangeEndDate = dateOnly(rangeEnd);
    const finalDate = weekEnd > rangeEndDate ? rangeEndDate : weekEnd;
    const format = new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", timeZone: "UTC" });
    return `${format.format(weekStart)} – ${format.format(finalDate)}`;
  }
  return new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", timeZone: "UTC" }).format(date);
}

function sumDailyRows(rows, valueName) {
  return new Map(rows.map((row) => [row._id, Number(row[valueName] || 0)]));
}

function buildBuckets({ startDate, endDate, granularity, payments, members, attendance, renewals }) {
  const paymentByDay = sumDailyRows(payments, "total");
  const membersByDay = sumDailyRows(members, "count");
  const attendanceByDay = sumDailyRows(attendance, "count");
  const renewalsByDay = sumDailyRows(renewals, "count");
  const values = new Map();
  for (let day = startDate; day <= endDate; day = addDays(day, 1)) {
    const key = dayKeyForGranularity(day, granularity);
    const bucket = values.get(key) || { key, label: bucketLabel(key, granularity, startDate, endDate), firstDate: day, lastDate: day, paymentCollected: 0, newMembers: 0, attendanceCount: 0, renewals: 0 };
    bucket.lastDate = day;
    bucket.paymentCollected += paymentByDay.get(day) || 0;
    bucket.newMembers += membersByDay.get(day) || 0;
    bucket.attendanceCount += attendanceByDay.get(day) || 0;
    bucket.renewals += renewalsByDay.get(day) || 0;
    values.set(key, bucket);
  }
  const format = new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return [...values.values()].map(({ firstDate, lastDate, ...bucket }) => ({
    ...bucket,
    tooltipLabel: firstDate === lastDate ? format.format(dateOnly(firstDate)) : `${format.format(dateOnly(firstDate))} – ${format.format(dateOnly(lastDate))}`,
  }));
}

function totalsForRange({ startDate, endDate, payments, members, attendance, renewals }) {
  const sum = (rows, field) => rows.reduce((total, row) => row._id >= startDate && row._id <= endDate ? total + Number(row[field] || 0) : total, 0);
  return {
    paymentCollected: sum(payments, "total"),
    newMembers: sum(members, "count"),
    attendanceCount: sum(attendance, "count"),
    renewals: sum(renewals, "count"),
  };
}

function percentageChange(current, previous) {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function buildGymReportAnalytics({ period, payments = [], members = [], attendance = [], renewals = [], totalMembers = 0, activeSubscriptions = 0, membershipStatuses = [] }) {
  const selected = totalsForRange({ startDate: period.startDate, endDate: period.endDate, payments, members, attendance, renewals });
  const previous = totalsForRange({ startDate: period.previousStartDate, endDate: period.previousEndDate, payments, members, attendance, renewals });
  const series = buildBuckets({ startDate: period.startDate, endDate: period.endDate, granularity: period.granularity, payments, members, attendance, renewals });
  const monthSeries = buildBuckets({ startDate: monthStartOffset(period.endDate, -5), endDate: period.endDate, granularity: "month", payments, members, attendance, renewals });
  const attendanceByDay = sumDailyRows(attendance, "count");
  const attendanceDays = [];
  for (let day = period.startDate; day <= period.endDate; day = addDays(day, 1)) {
    attendanceDays.push({ date: day, count: attendanceByDay.get(day) || 0 });
  }
  const distribution = buildMembershipStatusDistribution(membershipStatuses);
  const activeMemberships = distribution.active + distribution.expiring;

  return {
    period: {
      range: period.range,
      startDate: period.startDate,
      endDate: period.endDate,
      days: period.days,
      granularity: period.granularity,
      timezone: period.timezone,
      today: period.today,
    },
    series,
    months: monthSeries,
    attendanceDays,
    summary: {
      totalMembers,
      activeMemberships,
      activeSubscriptions,
      paymentCollected: selected.paymentCollected,
      newMembers: selected.newMembers,
      attendanceCount: selected.attendanceCount,
      renewals: selected.renewals,
      averageAttendancePerDay: period.days ? Math.round((selected.attendanceCount / period.days) * 10) / 10 : 0,
      attendanceRate: null,
      membershipStatuses: distribution,
      periodComparison: {
        previousStartDate: period.previousStartDate,
        previousEndDate: period.previousEndDate,
        paymentCollected: previous.paymentCollected,
        newMembers: previous.newMembers,
        attendanceCount: previous.attendanceCount,
        renewals: previous.renewals,
        averageAttendancePerDay: period.days ? Math.round((previous.attendanceCount / period.days) * 10) / 10 : 0,
        paymentCollectedChangePercent: percentageChange(selected.paymentCollected, previous.paymentCollected),
        newMembersChangePercent: percentageChange(selected.newMembers, previous.newMembers),
        attendanceChangePercent: percentageChange(selected.attendanceCount, previous.attendanceCount),
        renewalsChangePercent: percentageChange(selected.renewals, previous.renewals),
      },
    },
  };
}
