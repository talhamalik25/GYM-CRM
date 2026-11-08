import { DEFAULT_LOCALE, getCountry } from "../config/locales.js";

function validDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatNumber(value, { locale = DEFAULT_LOCALE, ...options } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return new Intl.NumberFormat(locale, options).format(number);
}

export function formatCurrency(value, { countryCode = "PK", locale, currency } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  const country = getCountry(countryCode);
  const currencyCode = currency || country?.currency;
  if (!currencyCode) throw new RangeError("A valid ISO 4217 currency code is required.");
  return new Intl.NumberFormat(locale || country?.formatLocale || DEFAULT_LOCALE, {
    style: "currency",
    currency: currencyCode,
  }).format(number);
}

export function formatDate(value, {
  locale = DEFAULT_LOCALE,
  timeZone = "UTC",
  ...options
} = {}) {
  const date = validDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone, ...options }).format(date);
}

export function formatTime(value, {
  locale = DEFAULT_LOCALE,
  timeZone = "UTC",
  ...options
} = {}) {
  const date = validDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone, ...options }).format(date);
}
