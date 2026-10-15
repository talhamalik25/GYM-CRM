export const DEFAULT_GYM_TIMEZONE = "Asia/Karachi";

export function gymToday(now = new Date(), timezone = process.env.GYM_TIMEZONE || DEFAULT_GYM_TIMEZONE) {
  try { return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now); }
  catch { return new Intl.DateTimeFormat("en-CA", { timeZone: DEFAULT_GYM_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now); }
}

export function isDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function dateOnly(value) { return new Date(`${value}T00:00:00.000Z`); }
export function addDays(value, days) { const date = new Date(`${value}T00:00:00.000Z`); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); }
export function deriveSubscriptionStatus(subscription, today = gymToday()) {
  if (subscription.status === "cancelled") return "cancelled";
  if (subscription.startDate > dateOnly(today)) return "pending";
  if (subscription.expiryDate < dateOnly(today)) return "expired";
  return "active";
}
