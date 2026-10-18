import { validatePassword } from "./passwords.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_FIELDS = new Set(["fullName", "email", "password", "gymName"]);

export function validateGymOwnerRegistrationBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { message: "Request body must be a JSON object.", fields: {} };
  }

  const fields = {};
  for (const key of Object.keys(body)) {
    if (!ALLOWED_FIELDS.has(key)) fields[key] = "This field cannot be changed.";
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  if (fullName.length < 2 || fullName.length > 120) fields.fullName = "Enter a name between 2 and 120 characters.";

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) fields.email = "Enter a valid email address.";

  const passwordError = validatePassword(body.password);
  if (passwordError) fields.password = passwordError;

  const gymName = typeof body.gymName === "string" ? body.gymName.trim() : "";
  if (gymName.length < 2 || gymName.length > 120) fields.gymName = "Enter a gym name between 2 and 120 characters.";

  if (Object.keys(fields).length) return { message: "Please correct the registration details.", fields };
  return { fullName, email, password: body.password, gymName };
}
