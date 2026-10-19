import connectToDatabase from "../../../../lib/db.js";
import { getRequestGymId, getRequestTenantContext, requireApiUser } from "../../../../lib/auth.js";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse.js";
import { serializeOwnerDashboard } from "../../../../lib/ownerDashboardRules.js";
import Member from "../../../../models/Member.js";
import Plan from "../../../../models/Plan.js";
import Trainer from "../../../../models/Trainer.js";

export async function GET(request) {
  const authResponse = await requireApiUser(request, { allowedRoles: ["gym_owner"] });
  if (authResponse) return authResponse;

  const context = getRequestTenantContext(request);
  if (!context?.gymId || !context?.gym) {
    return errorResponse("Gym workspace could not be resolved.", 403);
  }

  try {
    await connectToDatabase();
    const scope = { gymId: getRequestGymId(request) };
    const [members, plans, trainers] = await Promise.all([
      Member.countDocuments(scope),
      Plan.countDocuments(scope),
      Trainer.countDocuments(scope),
    ]);
    return successResponse(serializeOwnerDashboard(context.gym, { members, plans, trainers }));
  } catch {
    console.error("Gym owner dashboard could not be loaded.");
    return errorResponse("Could not load your gym dashboard. Please try again.", 503);
  }
}
