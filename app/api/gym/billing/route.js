import mongoose from "mongoose";
import Gym from "../../../../models/Gym.js";
import { getGymUsage, assertPlanFits, lockGym, EntitlementError, entitlementErrorResponse } from "../../../../lib/entitlements.js";
import { trialSummary } from "../../../../lib/publicTrialAccess.js";
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
      entitlements: context.entitlements, usage: await getGymUsage(context.gymId), trial: trialSummary(context.gym),
      planChangeRequest: context.gym.planChangeRequest || null,
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

export async function POST(request) {
  const denied = await requireApiUser(request, { allowedRoles: ["gym_owner"], allowSaaSInactive: true });
  if (denied) return denied;
  let session;
  try {
    const body = await request.json();
    if (!body || Object.keys(body).some((key) => key !== "planId") || !mongoose.isObjectIdOrHexString(body.planId)) return errorResponse("Choose a valid plan.", 400);
    const context = getRequestTenantContext(request);
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const gym = await lockGym(context.gymId, session);
      const plan = await SaaSPlan.findOne({ _id: body.planId, isActive: true, price: { $gt: 0 } }).session(session).lean();
      if (!plan) throw new EntitlementError("Choose an available paid plan.", "INVALID_PLAN", 400);
      if (gym.saasSubscription?.pendingInvoiceId) throw new EntitlementError("An invoice is already awaiting reconciliation.", "INVOICE_PENDING", 409);
      await assertPlanFits(gym._id, plan, session);
      await Gym.updateOne({ _id: gym._id }, { $set: { planChangeRequest: { planId: plan._id, requestedAt: new Date(), requestedBy: context.user._id } } }, { session });
    });
    return successResponse({ requested: true, message: "Request sent for Superadmin review. Paid access changes only after payment reconciliation." }, 201);
  } catch (error) {
    if (error instanceof EntitlementError) return entitlementErrorResponse(error);
    return errorResponse(error instanceof SyntaxError ? "Enter valid request details." : "Could not request the plan change.", error instanceof SyntaxError ? 400 : 503);
  } finally { if (session) await session.endSession(); }
}
