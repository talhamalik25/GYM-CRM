import { gymToday } from "./subscriptionRules.js";

export function getGymDate(now = new Date(), dayOffset = 0) {
  if (!Number.isSafeInteger(dayOffset)) throw new RangeError("dayOffset must be a whole number.");
  const current = gymToday(now);
  const date = new Date(`${current}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - dayOffset);
  return date.toISOString().slice(0, 10);
}
