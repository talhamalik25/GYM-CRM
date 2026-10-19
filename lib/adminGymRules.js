const GYM_STATUSES = Object.freeze(["active", "suspended"]);

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
