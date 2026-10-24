import { getRequestGymId, getRequestTenantContext } from "./auth.js";
import { gymEntitlements, getGymUsage, EntitlementError, entitlementErrorResponse } from "./entitlements.js";

// Compatibility advisory only. Mutations use the shared transactional engine.
export async function enforceSaaSCapacity(request, resource) {
  try {
    const entitlements = gymEntitlements(getRequestTenantContext(request)?.gym);
    const limit = entitlements.limits[resource];
    if (limit == null) return null;
    const usage = await getGymUsage(getRequestGymId(request));
    if (usage[resource] < limit) return null;
    return entitlementErrorResponse(new EntitlementError(`Your plan allows ${limit} ${resource}. Reduce usage or request an upgrade.`, "LIMIT_EXCEEDED", 409, { resource, limit, used: usage[resource] }));
  } catch (error) {
    if (error instanceof EntitlementError) return entitlementErrorResponse(error);
    throw error;
  }
}
