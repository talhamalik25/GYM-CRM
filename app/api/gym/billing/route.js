import connectToDatabase from "../../../../lib/db.js";
import { getRequestGymId, getRequestTenantContext, requireApiUser } from "../../../../lib/auth.js";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse.js";
import { serializeGymSaaSSubscription, serializeSaaSPlan } from "../../../../lib/platformBillingRules.js";
import SaaSPlan from "../../../../models/SaaSPlan.js";
import PlatformInvoice from "../../../../models/PlatformInvoice.js";
import PlatformSetting from "../../../../models/PlatformSetting.js";

export async function GET(request) {
  // Owners must retain read access to invoices and support instructions when SaaS access is restricted.
  const authResponse = await requireApiUser(request, { allowedRoles: ["gym_owner"], allowSaaSInactive: true, allowSuspendedGym: true });
  if (authResponse) return authResponse;
  const context = getRequestTenantContext(request);
  if (!context?.gymId || !context?.gym) return errorResponse("Gym workspace could not be resolved.", 403);
  try {
    await connectToDatabase();
    const [invoices, settings] = await Promise.all([PlatformInvoice.find({ gymId: getRequestGymId(request) })
      .select("invoiceNumber gymId planId planSnapshot amountDue currency periodStart periodEnd status issuedAt paidAt paymentReference")
      .sort({ issuedAt: -1, _id: -1 }).limit(50).lean(), PlatformSetting.findById("fitivo").select("manualBillingInstructions").lean()]);
    return successResponse({
      subscription: serializeGymSaaSSubscription(context.gym.saasSubscription, invoices),
      billingMode: "manual",
      paymentProviderConfigured: false,
      manualBillingInstructions: settings?.manualBillingInstructions || "",
      plans: (await SaaSPlan.find({ isActive: true, price: { $gt: 0 } }).sort({ price: 1, _id: 1 }).lean()).map(serializeSaaSPlan),
    });
  } catch {
    console.error("Gym SaaS billing details could not be loaded.");
    return errorResponse("Could not load your Fitivo plan and billing details.", 503);
  }
}
