import { getGymReportMonths } from "./reportRules.js";

export function getPlatformAnalyticsMonths(now = new Date()) {
  return getGymReportMonths(now, "UTC", 6);
}

export function buildPlatformAnalytics({ monthWindows, gymStatuses = [], saasStatuses = [], onboarding = [], invoiceTrends = [] }) {
  const gymStatus = { active: 0, suspended: 0 };
  const saasStatus = { trialing: 0, active: 0, past_due: 0, expired: 0, cancelled: 0, unconfigured: 0 };
  for (const item of gymStatuses) if (Object.hasOwn(gymStatus, item._id)) gymStatus[item._id] = item.count;
  for (const item of saasStatuses) if (Object.hasOwn(saasStatus, item._id)) saasStatus[item._id] = item.count;

  const byMonth = (items) => new Map(items.map((item) => [item._id, item]));
  const onboardedByMonth = byMonth(onboarding);
  const invoicesByMonth = byMonth(invoiceTrends);
  const months = monthWindows.map(({ month }) => ({
    month,
    gymsOnboarded: onboardedByMonth.get(month)?.count || 0,
    invoiced: invoicesByMonth.get(month)?.invoiced || 0,
    collected: invoicesByMonth.get(month)?.collected || 0,
  }));
  return { gymStatus, saasStatus, months };
}
