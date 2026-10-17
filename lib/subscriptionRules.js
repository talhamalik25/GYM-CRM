export const DEFAULT_GYM_TIMEZONE = "Asia/Karachi";
const DAY_MS = 86400000;

export function resolveGymTimezone(timezone = process.env.GYM_TIMEZONE) {
  const candidate = typeof timezone === "string" && timezone.trim() ? timezone.trim() : DEFAULT_GYM_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate });
    return candidate;
  } catch {
    return DEFAULT_GYM_TIMEZONE;
  }
}

export function gymToday(now = new Date(), timezone = process.env.GYM_TIMEZONE) {
  const instant = now instanceof Date ? now : new Date(now);
  if (!Number.isFinite(instant.getTime())) return gymToday(new Date(), timezone);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: resolveGymTimezone(timezone), year: "numeric", month: "2-digit", day: "2-digit",
  }).format(instant);
}

export function isDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function dateOnly(value) {
  if (!isDateOnly(value)) throw new RangeError("Expected a valid YYYY-MM-DD date.");
  return new Date(`${value}T00:00:00.000Z`);
}

export function addDays(value, days) {
  if (!isDateOnly(value) || !Number.isSafeInteger(days)) throw new RangeError("Expected a valid date and whole day count.");
  const date = dateOnly(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// Duration counts the start date as day one. Both dates are inclusive.
export function membershipExpiryDate(startDate, durationDays) {
  if (!isDateOnly(startDate) || !Number.isSafeInteger(Number(durationDays)) || Number(durationDays) < 1) return "";
  return addDays(startDate, Number(durationDays) - 1);
}

export function membershipDaysRemaining(expiryDate, today = gymToday()) {
  if (!isDateOnly(expiryDate) || !isDateOnly(today)) return null;
  return Math.round((dateOnly(expiryDate).getTime() - dateOnly(today).getTime()) / DAY_MS);
}

export function deriveMembershipStatus(expiryDate, today = gymToday(), expiringDays = 7, startDate = "") {
  if (isDateOnly(startDate) && isDateOnly(today) && startDate > today) return "Upcoming";
  const remaining = membershipDaysRemaining(expiryDate, today);
  if (remaining === null || remaining < 0) return "Expired";
  if (remaining <= expiringDays) return "Expiring";
  return "Active";
}

export function deriveSubscriptionStatus(subscription, today = gymToday()) {
  if (subscription.status === "cancelled") return "cancelled";
  const startDate = subscription.startDate instanceof Date ? subscription.startDate.toISOString().slice(0, 10) : subscription.startDate;
  const expiryDate = subscription.expiryDate instanceof Date ? subscription.expiryDate.toISOString().slice(0, 10) : subscription.expiryDate;
  if (isDateOnly(startDate) && startDate > today) return "pending";
  if (!isDateOnly(expiryDate) || expiryDate < today) return "expired";
  return "active";
}
