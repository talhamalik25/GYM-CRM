import { createHash, randomBytes } from "node:crypto";

// Trainers receive only the assigned-member read-only workspace, never Gym admin APIs.
export const INVITABLE_GYM_ROLES = Object.freeze(["gym_admin", "trainer"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateStaffInvitationBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { message: "Enter a valid invitation." };
  const fields = {};
  for (const key of Object.keys(body)) if (!["email", "role", "branchId"].includes(key)) fields[key] = "This field cannot be changed.";
  if (body.branchId != null && (typeof body.branchId !== "string" || !/^[a-f\d]{24}$/i.test(body.branchId))) fields.branchId = "Choose a valid branch.";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) fields.email = "Enter a valid email address.";
  if (!INVITABLE_GYM_ROLES.includes(body.role)) fields.role = "Choose an allowed staff role.";
  return Object.keys(fields).length ? { message: "Please correct the invitation details.", fields } : { email, role: body.role, ...(body.branchId ? { branchId: body.branchId } : {}) };
}

export function hashInvitationToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function createInvitationToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashInvitationToken(token) };
}
