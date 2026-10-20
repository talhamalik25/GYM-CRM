import { gymToday } from "./subscriptionRules.js";

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

export function buildGymReport({ monthWindows, payments = [], members = [], attendance = [], activeSubscriptions = 0 }) {
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
    },
  };
}
