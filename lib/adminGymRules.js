const GYM_STATUSES = Object.freeze(["active", "suspended"]);

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
