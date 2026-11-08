import { COUNTRIES, getCountry, isAvailableLocale } from "../config/locales.js";

export function validateGymSettings(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { message: "Request body must be a JSON object.", fields: {} };
  }

  const fields = {};
  for (const key of Object.keys(body)) {
    if (!["name", "timezone", "countryCode", "defaultLocale"].includes(key)) fields[key] = "This field cannot be changed.";
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 2 || name.length > 120) fields.name = "Gym name must be between 2 and 120 characters.";

  const timezone = typeof body.timezone === "string" ? body.timezone.trim() : "";
  if (!timezone || timezone.length > 100) {
    fields.timezone = "Enter a valid IANA timezone.";
  } else {
    try { new Intl.DateTimeFormat("en-US", { timeZone: timezone }); }
    catch { fields.timezone = "Enter a valid IANA timezone."; }
  }

  const countryCode = Object.hasOwn(body, "countryCode") ? body.countryCode : undefined;
  if (countryCode !== undefined && (typeof countryCode !== "string" || !getCountry(countryCode))) {
    fields.countryCode = `Choose one of the ${COUNTRIES.length} supported countries.`;
  }

  const defaultLocale = Object.hasOwn(body, "defaultLocale") ? body.defaultLocale : undefined;
  if (defaultLocale !== undefined && defaultLocale !== null && defaultLocale !== "" && !isAvailableLocale(defaultLocale)) {
    fields.defaultLocale = "This language is not available yet.";
  }

  if (Object.keys(fields).length) return { message: "Please correct the gym settings.", fields };
  return {
    name,
    timezone,
    ...(countryCode !== undefined ? { countryCode: countryCode.trim().toUpperCase() } : {}),
    ...(defaultLocale !== undefined ? { defaultLocale: defaultLocale || null } : {}),
  };
}

export function serializeGymSettings(gym) {
  return {
    name: gym.name || "",
    slug: gym.slug || "",
    timezone: gym.timezone || "Asia/Karachi",
    countryCode: getCountry(gym.countryCode)?.code || "PK",
    defaultLocale: isAvailableLocale(gym.defaultLocale) ? gym.defaultLocale : null,
    status: gym.status || "unavailable",
  };
}
