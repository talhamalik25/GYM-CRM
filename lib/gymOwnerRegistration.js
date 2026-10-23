import { validatePassword } from "./passwords.js";
import { planSnapshot } from "./platformBillingRules.js";

export const PUBLIC_TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// A stable public gym identity: never append random suffixes on collision.
export function registrationGymSlug(name) {
  return name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function publicTrialSubscription(plan, createdAt) {
  const trialEndsAt = new Date(createdAt.getTime() + PUBLIC_TRIAL_DURATION_MS);
  return {
    planId: plan._id, planSnapshot: planSnapshot(plan), status: "trialing",
    trialStartedAt: createdAt, trialEndsAt, renewalDate: trialEndsAt,
    periodStart: null, periodEnd: null, pendingInvoiceId: null, autoRenew: false,
  };
}

export function publicRegistrationConfigured() {
  return process.env.PUBLIC_REGISTRATION_ENABLED === "true"
    && /^[a-f\d]{24}$/i.test(process.env.PUBLIC_TRIAL_PLAN_ID || "");
}

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
  const slug = registrationGymSlug(gymName);
  if (!slug || slug.length > 80) fields.gymName = "Use a gym name containing letters A–Z or numbers, with a URL name up to 80 characters.";

  if (Object.keys(fields).length) return { message: "Please correct the registration details.", fields };
  return { fullName, email, password: body.password, gymName };
}
