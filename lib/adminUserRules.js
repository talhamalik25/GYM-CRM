import { validatePassword } from "./passwords.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isSuperadmin(user) {
  return user?.role === "superadmin" || user?.role === "platform_super_admin";
}

export function adminUserRoleLabel(user) {
  return isSuperadmin(user) ? "Superadmin" : "Staff";
}

export function validateAccountStatusChange({ actorId, targetId, desiredActive, targetRole, otherActiveSuperadmins }) {
  if (typeof desiredActive !== "boolean") return { status: 400, message: "Account status must be active or inactive." };
  if (desiredActive) return null;
  if (String(actorId) === String(targetId)) return { status: 409, message: "You cannot deactivate your own account." };
  if (isSuperadmin({ role: targetRole }) && otherActiveSuperadmins < 1) {
    return { status: 409, message: "At least one active Superadmin account must remain." };
  }
  return null;
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
    if (!["fullName", "email", "password"].includes(key)) fields[key] = "This field cannot be changed.";
  }
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  if (fullName.length < 2 || fullName.length > 120) fields.fullName = "Full name must be between 2 and 120 characters.";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) fields.email = "Enter a valid email address.";
  const passwordError = validatePassword(body.password);
  if (passwordError) fields.password = passwordError;
  return Object.keys(fields).length ? { message: "Please correct the account details.", fields } : { fullName, email, password: body.password };
}
