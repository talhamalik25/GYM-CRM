const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function isDateOnly(value) {
  if (typeof value !== "string" || !DATE_ONLY.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function formatDay(value, options = {}) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return new Intl.DateTimeFormat(options.locale || "en-PK", {
    day: "numeric", month: "short", timeZone: "UTC",
  }).format(date);
}

// Mongo aggregation result order is unspecified. Normalize by gym-local date,
// merge any duplicate date buckets, and retain zero-valued buckets.
export function buildDashboardTimeSeries(points = [], { dateKey = "date", valueKey = "count", unit = "check-ins", locale = "en-PK" } = {}) {
  const byDate = new Map();
  for (const point of points) {
    const date = point?.[dateKey];
    const value = point?.[valueKey];
    if (!isDateOnly(date) || !Number.isFinite(value) || value < 0) continue;
    byDate.set(date, (byDate.get(date) || 0) + value);
  }
  const ordered = [...byDate].sort(([left], [right]) => left.localeCompare(right));
  const maximum = Math.max(1, ...ordered.map(([, value]) => value));
  return ordered.map(([date, value]) => ({
    key: date,
    label: formatDay(date, { locale }),
    value,
    heightPercent: value === 0 ? 0 : value / maximum * 100,
    tooltip: `${formatDay(date, { locale })}: ${value.toLocaleString(locale)} ${unit}`,
  }));
}

// The dues card total covers every positive balance. Show the four largest
// balances plus an exact remainder so the mini-chart sums to that same total.
export function buildDuesChart(entries = [], { limit = 4, locale = "en-PK" } = {}) {
  const valid = entries.filter((entry) => Number.isFinite(entry?.balance) && entry.balance > 0)
    .map((entry) => ({ name: entry.memberName || "Member unavailable", value: entry.balance }))
    .sort((left, right) => right.value - left.value || left.name.localeCompare(right.name));
  const total = valid.reduce((sum, entry) => sum + entry.value, 0);
  const largest = valid.slice(0, limit);
  const remainder = total - largest.reduce((sum, entry) => sum + entry.value, 0);
  if (remainder > 0) largest.push({ name: "Other members", value: remainder });
  const maximum = Math.max(1, ...largest.map(({ value }) => value));
  return largest.map(({ name, value }, index) => ({
    key: `${index}:${name}`,
    label: name,
    value,
    heightPercent: value / maximum * 100,
    tooltip: `${name}: PKR ${value.toLocaleString(locale)}`,
  }));
}
