export function validateOwnerProfile(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { message: "Request body must be a JSON object.", fields: {} };
  const fields = {};
  for (const key of Object.keys(body)) if (!["fullName", "phone"].includes(key)) fields[key] = "This field cannot be changed in your profile.";
  if (!Object.hasOwn(body, "fullName")) fields.fullName = "Name is required.";
  if (!Object.hasOwn(body, "phone")) fields.phone = "Phone must be provided; leave it blank to remove it.";
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  if (fullName.length < 2 || fullName.length > 120) fields.fullName = "Name must be between 2 and 120 characters.";
  const phone = body.phone === undefined ? "" : typeof body.phone === "string" ? body.phone.trim().replace(/[\s()-]/g, "") : null;
  if (phone === null || (phone && !/^\+?\d{7,15}$/.test(phone))) fields.phone = "Enter a phone number with 7 to 15 digits, or leave it blank.";
  return Object.keys(fields).length ? { message: "Please correct the profile details.", fields } : { fullName, phone };
}

export function serializeOwnerProfile(user) {
  return { fullName: user.fullName || "", email: user.email, phone: user.phone || "" };
}
