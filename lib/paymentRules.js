import { createHash } from "node:crypto";

export const DEFAULT_GYM_TIMEZONE = "Asia/Karachi";

export function isWholeRupeePrice(value) {
  return Number.isSafeInteger(value) && value > 0;
}

export function makePaymentFingerprint({ memberId, amountPaid, method, paymentDate, notes }) {
  const canonical = JSON.stringify({
    memberId: String(memberId).toLowerCase(),
    amountPaid,
    method,
    paymentDate,
    notes: notes.trim(),
  });
  return createHash("sha256").update(canonical).digest("hex");
}

export function isValidIdempotencyKey(value) {
  return typeof value === "string" && /^[A-Za-z0-9._:-]{16,128}$/.test(value);
}

function gymTimezone() {
  const timezone = process.env.GYM_TIMEZONE || DEFAULT_GYM_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone });
    return timezone;
  } catch {
    return DEFAULT_GYM_TIMEZONE;
  }
}

export function paymentMonthRange(month) {
  if (typeof month !== "string" || !/^(\d{4})-(0[1-9]|1[0-2])$/.test(month)) return null;
  const [, year, monthNumber] = month.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  return {
    start: new Date(Date.UTC(Number(year), Number(monthNumber) - 1, 1)),
    end: new Date(Date.UTC(Number(year), Number(monthNumber), 1)),
  };
}

export function currentGymPaymentMonthRange(now = new Date(), timezone = gymTimezone()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit" }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return paymentMonthRange(`${year}-${month}`);
}
