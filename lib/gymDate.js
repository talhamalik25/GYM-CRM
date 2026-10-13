const DATE_PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: process.env.GYM_TIMEZONE || "Asia/Karachi",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getGymDate(now = new Date(), dayOffset = 0) {
  const parts = Object.fromEntries(DATE_PARTS.formatToParts(now).map(({ type, value }) => [type, value]));
  // Use the gym's calendar day: at 00:30 in Karachi, UTC still reports the previous date.
  const calendarDate = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day) - dayOffset));
  return `${calendarDate.getUTCFullYear()}-${String(calendarDate.getUTCMonth() + 1).padStart(2, "0")}-${String(calendarDate.getUTCDate()).padStart(2, "0")}`;
}

