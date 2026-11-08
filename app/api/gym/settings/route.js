import { readJsonBody, RequestBodyError, requestBodyErrorResponse } from "../../../../lib/requestBody.js";
import connectToDatabase from "../../../../lib/db.js";
import { getRequestGymId, getRequestTenantContext, requireApiUser } from "../../../../lib/auth.js";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse.js";
import { serializeGymSettings, validateGymSettings } from "../../../../lib/gymSettingsRules.js";
import Gym from "../../../../models/Gym.js";

export async function GET(request) {
  const authResponse = await requireApiUser(request, { allowedRoles: ["gym_owner"] });
  if (authResponse) return authResponse;
  const context = getRequestTenantContext(request);
  if (!context?.gym) return errorResponse("Gym workspace could not be resolved.", 403);
  return successResponse(serializeGymSettings(context.gym));
}

export async function PATCH(request) {
  const authResponse = await requireApiUser(request, { allowedRoles: ["gym_owner"] });
  if (authResponse) return authResponse;
  let body;
  try { body = await readJsonBody(request); }
  catch (error) { if (error instanceof RequestBodyError) return requestBodyErrorResponse(error); return errorResponse("Request body must be valid JSON.", 400); }
  const validation = validateGymSettings(body);
  if (validation.message) return errorResponse(validation.message, 400, validation.fields);

  try {
    await connectToDatabase();
    const gym = await Gym.findOneAndUpdate(
      { _id: getRequestGymId(request), status: "active" },
      { $set: {
        name: validation.name,
        timezone: validation.timezone,
        ...(validation.countryCode !== undefined ? { countryCode: validation.countryCode } : {}),
        ...(validation.defaultLocale !== undefined ? { defaultLocale: validation.defaultLocale } : {}),
      } },
      { returnDocument: "after", runValidators: true },
    ).select("name slug timezone countryCode defaultLocale status").lean();
    if (!gym) return errorResponse("Gym workspace was not found or is unavailable.", 404);
    return successResponse(serializeGymSettings(gym));
  } catch {
    console.error("Gym settings could not be updated.");
    return errorResponse("Could not save gym settings. Please try again.", 503);
  }
}
