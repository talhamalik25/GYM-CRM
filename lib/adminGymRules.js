const GYM_STATUSES = Object.freeze(["active", "suspended"]);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateGymProvisioning(body, { defaultTrialDays = 0 } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { message: "Request body must be a JSON object.", fields: {} };
  const fields = {};
  for (const key of Object.keys(body)) {
    if (!["name", "slug", "timezone", "ownerEmail", "accessMode", "planId", "trialDays"].includes(key)) fields[key] = "This field cannot be changed.";
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 2 || name.length > 120) fields.name = "Gym name must be between 2 and 120 characters.";
  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  if (!slug || slug.length > 80 || !SLUG_PATTERN.test(slug)) fields.slug = "Use lowercase letters, numbers, and single hyphens in the Gym URL.";
  const timezone = typeof body.timezone === "string" ? body.timezone.trim() : "";
  try { if (!timezone || timezone.length > 100) throw new Error(); new Intl.DateTimeFormat("en-US", { timeZone: timezone }); }
  catch { fields.timezone = "Enter a valid IANA timezone."; }
  const ownerEmail = typeof body.ownerEmail === "string" ? body.ownerEmail.trim().toLowerCase() : "";
  if (!ownerEmail || ownerEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) fields.ownerEmail = "Choose an existing staff account email.";
  const accessMode = body.accessMode;
  if (!["trial", "invoice", "none"].includes(accessMode)) fields.accessMode = "Choose a trial, manual invoice, or no immediate access.";
  let planId = "";
  let trialDays = null;
  if (["trial", "invoice"].includes(accessMode)) {
    planId = typeof body.planId === "string" && /^[a-f\d]{24}$/i.test(body.planId) ? body.planId : "";
    if (!planId) fields.planId = "Choose an active SaaS plan.";
  } else if (body.planId !== undefined) fields.planId = "A plan can only be assigned with trial or invoice access.";
  if (accessMode === "trial") {
    trialDays = body.trialDays === undefined ? defaultTrialDays : body.trialDays;
    if (!Number.isSafeInteger(trialDays) || trialDays < 1 || trialDays > 90) fields.trialDays = "Trial length must be from 1 to 90 days.";
  } else if (body.trialDays !== undefined) fields.trialDays = "Trial days are only supported for trial access.";
  return Object.keys(fields).length ? { message: "Please correct the Gym provisioning details.", fields } : { name, slug, timezone, ownerEmail, accessMode, planId, trialDays };
}

export class GymProvisioningError extends Error {
  constructor(message, status = 409, fields = {}) {
    super(message);
    this.name = "GymProvisioningError";
    this.status = status;
    this.fields = fields;
  }
}

export async function lockOwnerAccountForAssignment(user, session, User) {
  const result = await User.updateOne(
    { _id: user._id, role: "staff", isActive: true, __v: user.__v || 0 },
    { $inc: { __v: 1 } },
    { session },
  );
  if (result.modifiedCount !== 1) throw new GymProvisioningError("The staff account changed during assignment. Refresh and try again.");
}

export async function ensureNoConflictingGymMembership(userId, session, GymMembership) {
  const active = await GymMembership.find({ userId, status: "active" }).select("gymId role").session(session).lean();
  if (active.length) throw new GymProvisioningError("This account already has an active Gym membership. Revoke the existing assignment before assigning another.");
}

export function filterAdminGyms(gyms, { query = "", status = "all" } = {}) {
  const normalizedQuery = typeof query === "string" ? query.trim().toLocaleLowerCase() : "";
  return gyms.filter((gym) => {
    if (status !== "all" && gym.status !== status) return false;
    if (!normalizedQuery) return true;
    const searchable = [gym.name, gym.slug, ...(gym.owners || []).flatMap((owner) => [owner.name, owner.email])]
      .filter((value) => typeof value === "string")
      .join(" ")
      .toLocaleLowerCase();
    return searchable.includes(normalizedQuery);
  });
}

export function validateGymOwnerAssignment(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { message: "Request body must be a JSON object.", fields: {} };
  }
  const fields = {};
  for (const key of Object.keys(body)) {
    if (key !== "gymId" && key !== "email") fields[key] = "This field cannot be changed.";
  }
  if (typeof body.gymId !== "string" || !/^[a-f\d]{24}$/i.test(body.gymId)) fields.gymId = "Choose a valid gym.";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fields.email = "Enter a valid account email address.";
  return Object.keys(fields).length ? { message: "Please correct the owner assignment details.", fields } : { gymId: body.gymId, email };
}

export function validateGymStatusUpdate(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { message: "Request body must be a JSON object.", fields: {} };
  }
  const fields = {};
  for (const key of Object.keys(body)) {
    if (key !== "status") fields[key] = "This field cannot be changed.";
  }
  if (!GYM_STATUSES.includes(body.status)) fields.status = "Choose active or suspended.";
  if (Object.keys(fields).length) return { message: "Please correct the gym details.", fields };
  return { status: body.status };
}

export function serializeAdminGym(gym, memberships = []) {
  return {
    id: String(gym._id),
    name: gym.name,
    slug: gym.slug,
    status: gym.status,
    timezone: gym.timezone,
    createdAt: gym.createdAt,
    updatedAt: gym.updatedAt,
    owners: memberships.map(({ userId }) => userId && typeof userId === "object" ? {
      name: userId.fullName || "Name unavailable",
      email: userId.email || "",
    } : null).filter(Boolean),
  };
}
