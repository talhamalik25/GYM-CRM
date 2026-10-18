import { createHash, randomBytes } from "node:crypto";

// Trainers remain a valid legacy membership role, but invitations stay limited
// to roles with an explicitly reviewed set of tenant API permissions.
export const INVITABLE_GYM_ROLES = Object.freeze(["gym_admin"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateStaffInvitationBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { message: "Enter a valid invitation." };
  const fields = {};
  for (const key of Object.keys(body)) if (!["email", "role"].includes(key)) fields[key] = "This field cannot be changed.";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) fields.email = "Enter a valid email address.";
  if (body.role === "trainer") fields.role = "Trainer invitations are paused until trainer-specific permissions are defined.";
  else if (!INVITABLE_GYM_ROLES.includes(body.role)) fields.role = "Choose an allowed staff role.";
  return Object.keys(fields).length ? { message: "Please correct the invitation details.", fields } : { email, role: body.role };
}

export function hashInvitationToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function createInvitationToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashInvitationToken(token) };
}
