import { requireApiUser, getRequestTenantContext } from "../../../../lib/auth.js";
import { getGymUsage } from "../../../../lib/entitlements.js";
import { trialSummary } from "../../../../lib/publicTrialAccess.js";
import { successResponse, errorResponse } from "../../../../lib/planApiResponse.js";
export async function GET(request) {
  const denied = await requireApiUser(request, { allowedRoles: ["gym_owner", "gym_admin", "trainer"], allowSaaSInactive: true });
  if (denied) return denied;
  try {
    const context = getRequestTenantContext(request);
    return successResponse({ ...context.entitlements, role: context.role, trial: trialSummary(context.gym), usage: context.role === "gym_owner" ? await getGymUsage(context.gymId) : undefined });
  } catch { return errorResponse("Could not load plan entitlements.", 503); }
}
