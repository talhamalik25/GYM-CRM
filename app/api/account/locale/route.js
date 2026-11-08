import { getAuthenticatedUserFromRequest, validateRequestOrigin } from "../../../../lib/auth.js";
import { readJsonBody, RequestBodyError, requestBodyErrorResponse } from "../../../../lib/requestBody.js";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse.js";
import { isAvailableLocale } from "../../../../config/locales.js";
import User from "../../../../models/User.js";

export async function GET(request) {
  const user = await getAuthenticatedUserFromRequest(request);
  if (!user) return errorResponse("Authentication is required.", 401);
  return successResponse({ locale: user.preferredLocale || null });
}

export async function PATCH(request) {
  const originError = validateRequestOrigin(request);
  if (originError) return originError;

  let body;
  try { body = await readJsonBody(request); }
  catch (error) {
    if (error instanceof RequestBodyError) return requestBodyErrorResponse(error);
    return errorResponse("Request body must be valid JSON.", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return errorResponse("Request body must be a JSON object.", 400);
  }
  const fields = {};
  for (const key of Object.keys(body)) {
    if (key !== "locale") fields[key] = "This field cannot be changed.";
  }
  if (!Object.hasOwn(body, "locale")) fields.locale = "Choose a language or reset to the workspace default.";
  else if (body.locale !== null && (typeof body.locale !== "string" || !isAvailableLocale(body.locale))) {
    fields.locale = "This language is not available yet.";
  }
  if (Object.keys(fields).length) return errorResponse("Please correct the language preference.", 400, fields);

  const user = await getAuthenticatedUserFromRequest(request);
  if (!user) return errorResponse("Authentication is required.", 401);

  try {
    const updated = await User.findOneAndUpdate(
      { _id: user._id, isActive: { $ne: false } },
      { $set: { preferredLocale: body.locale } },
      { returnDocument: "after", runValidators: true },
    ).select("preferredLocale").lean();
    if (!updated) return errorResponse("User account was not found or is inactive.", 401);
    return successResponse({ locale: updated.preferredLocale || null });
  } catch {
    console.error("Language preference could not be saved.");
    return errorResponse("Could not save your language preference. Please try again.", 503);
  }
}
