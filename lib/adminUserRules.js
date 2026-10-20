import { validatePassword } from "./passwords.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isSuperadmin(user) {
  return user?.role === "superadmin" || user?.role === "platform_super_admin";
}

export function adminUserRoleLabel(user) {
  return isSuperadmin(user) ? "Superadmin" : "Staff";
}

export function serializeAdminUser(user) {
  return {
    id: String(user._id),
    fullName: user.fullName || "",
    email: user.email,
    role: user.role || "staff",
    isActive: Boolean(user.isActive),
    createdAt: user.createdAt,
  };
}

export function validateCreateUserBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { message: "Request body must be a JSON object.", fields: {} };
  }
  const fields = {};
  for (const key of Object.keys(body)) {
    if (!["email", "password"].includes(key)) fields[key] = "This field cannot be changed.";
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) fields.email = "Enter a valid email address.";
  const passwordError = validatePassword(body.password);
  if (passwordError) fields.password = passwordError;
  return Object.keys(fields).length ? { message: "Please correct the account details.", fields } : { email, password: body.password };
}
