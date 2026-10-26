export function successResponse(data, status = 200) {
  return Response.json({ success: true, data }, { status, headers: { "Cache-Control": "no-store" } });
}

export function errorResponse(message, status = 500, fields, context) {
  return Response.json({
    success: false,
    error: { message, ...(fields ? { fields } : {}), ...(context ? { context } : {}) },
  }, { status, headers: { "Cache-Control": "no-store" } });
}

export function handlePlanError(error) {
  if (error?.code === 11000) {
    return errorResponse("A plan with this name already exists.", 409, { name: "A plan with this name already exists." });
  }
  if (error?.name === "ValidationError") {
    const fields = Object.fromEntries(Object.entries(error.errors || {}).map(([key, value]) => [key, value.message]));
    return errorResponse("Please check the plan details and try again.", 400, fields);
  }
  console.error("Plans API error:");
  return errorResponse("Something went wrong while accessing plans. Please try again.", 500);
}

export function validatePlanBody(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { message: "Request body must be a JSON object.", fields: {} };
  }

  const allowed = ["name", "price", "durationDays", "description", "isActive"];
  const fields = {};
  for (const key of Object.keys(body)) {
    if (!allowed.includes(key)) fields[key] = "This field cannot be changed.";
  }

  if (!partial || Object.hasOwn(body, "name")) {
    if (typeof body.name !== "string" || !body.name.trim()) fields.name = "Plan name is required.";
  }
  if (!partial || Object.hasOwn(body, "price")) {
    if (typeof body.price !== "number" || !Number.isSafeInteger(body.price) || body.price <= 0) {
      fields.price = "Price must be a whole number of rupees greater than zero.";
    }
  }
  if (!partial || Object.hasOwn(body, "durationDays")) {
    if (!Number.isSafeInteger(body.durationDays) || body.durationDays <= 0) {
      fields.durationDays = "Duration must be a whole number of days greater than zero.";
    }
  }
  if (Object.hasOwn(body, "description") && typeof body.description !== "string") {
    fields.description = "Description must be text.";
  }
  if (Object.hasOwn(body, "isActive") && typeof body.isActive !== "boolean") {
    fields.isActive = "Active status must be true or false.";
  }
  if (partial && Object.keys(body).length === 0) return { message: "Provide at least one field to update.", fields };
  return Object.keys(fields).length ? { message: "Please correct the highlighted fields.", fields } : null;
}
