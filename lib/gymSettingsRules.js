export function validateGymSettings(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { message: "Request body must be a JSON object.", fields: {} };
  }

  const fields = {};
  for (const key of Object.keys(body)) {
    if (key !== "name" && key !== "timezone") fields[key] = "This field cannot be changed.";
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

  return Object.keys(fields).length ? { message: "Please correct the gym settings.", fields } : { name, timezone };
}

export function serializeGymSettings(gym) {
  return {
    name: gym.name || "",
    slug: gym.slug || "",
    timezone: gym.timezone || "Asia/Karachi",
    status: gym.status || "unavailable",
  };
}
