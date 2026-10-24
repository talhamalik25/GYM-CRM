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
import { validatePaymentClaim } from "../../../../lib/platformBillingRules.js";

export async function GET(request) {
  // Owners must retain read access to invoices and support instructions when SaaS access is restricted.
  const authResponse = await requireApiUser(request, { allowedRoles: ["gym_owner"], allowSaaSInactive: true, allowSuspendedGym: true });
  if (authResponse) return authResponse;
  const context = getRequestTenantContext(request);
  if (!context?.gymId || !context?.gym) return errorResponse("Gym workspace could not be resolved.", 403);
  try {
    await connectToDatabase();
    const [invoices, settings] = await Promise.all([PlatformInvoice.find({ gymId: getRequestGymId(request) })
      .select("invoiceNumber gymId planId planSnapshot amountDue currency periodStart periodEnd status issuedAt paidAt paymentReference paymentClaims verifiedAmount verifiedReference verificationNotes verifiedAt verifiedBy")
      .populate("paymentClaims.submittedBy paymentClaims.reviewedBy verifiedBy", "fullName email")
      .sort({ issuedAt: -1, _id: -1 }).limit(50).lean(), PlatformSetting.findById("fitivo").select("manualBillingInstructions paymentInstructions").lean()]);
    const subscription = serializeGymSaaSSubscription(context.gym.saasSubscription, invoices);
    // Verification notes are an internal Superadmin audit record. Owners see
    // their claim status and final verification outcome, not staff-only notes.
    for (const invoice of subscription?.invoices || []) {
      delete invoice.verificationNotes;
      delete invoice.verifiedBy;
      for (const claim of invoice.paymentClaims || []) delete claim.reviewedBy;
    }
    return successResponse({
      subscription,
      entitlements: context.entitlements, usage: await getGymUsage(context.gymId), trial: trialSummary(context.gym),
      planChangeRequest: context.gym.planChangeRequest || null,
      billingMode: "manual",
      paymentProviderConfigured: false,
      manualBillingInstructions: settings?.manualBillingInstructions || "",
      paymentInstructions: settings?.paymentInstructions || [],
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
    if (body?.action === "submit_payment_claim") {
      if (Object.keys(body).some((key) => !["action", "invoiceId", "reference"].includes(key))) return errorResponse("Payment claim contains unsupported fields.", 400);
      const validation = validatePaymentClaim({ invoiceId: body.invoiceId, reference: body.reference });
      if (validation.message) return errorResponse(validation.message, 400, validation.fields);
      const context = getRequestTenantContext(request);
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const gym = await lockGym(context.gymId, session);
          const invoice = await PlatformInvoice.findOne({ _id: validation.invoiceId, gymId: context.gymId, status: "open" }).session(session);
          if (!invoice || String(gym.saasSubscription?.pendingInvoiceId) !== String(invoice._id)) throw new EntitlementError("This invoice is no longer pending for your Gym.", "INVOICE_NOT_PENDING", 409);
          if (invoice.paymentClaims.some((claim) => claim.status === "submitted")) throw new EntitlementError("A payment claim is already awaiting Superadmin review.", "PAYMENT_CLAIM_PENDING", 409);
          invoice.paymentClaims.push({ reference: validation.reference, submittedAt: new Date(), submittedBy: context.user._id, status: "submitted" });
          await invoice.save({ session });
        });
        return successResponse({ submitted: true, message: "Payment reference submitted for Superadmin review. This does not mark the invoice paid or activate your subscription." }, 201);
      } catch (error) {
        if (error instanceof EntitlementError) return entitlementErrorResponse(error);
        return errorResponse("Could not submit the payment reference.", 503);
      } finally { await session.endSession(); }
    }
    if (!body || Object.keys(body).some((key) => key !== "planId") || !mongoose.isObjectIdOrHexString(body.planId)) return errorResponse("Choose a valid plan.", 400);
    const context = getRequestTenantContext(request);
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const gym = await lockGym(context.gymId, session);
      const plan = await SaaSPlan.findOne({ _id: body.planId, isActive: true, price: { $gt: 0 } }).session(session).lean();
      if (!plan) throw new EntitlementError("Choose an available paid plan.", "INVALID_PLAN", 400);
      if (gym.saasSubscription?.pendingInvoiceId) throw new EntitlementError("An invoice is already awaiting reconciliation.", "INVOICE_PENDING", 409);
      await assertPlanFits(gym._id, String(gym.saasSubscription?.planId) === String(plan._id) ? gym.saasSubscription.planSnapshot : plan, session);
      await Gym.updateOne({ _id: gym._id }, { $set: { planChangeRequest: { planId: plan._id, requestedAt: new Date(), requestedBy: context.user._id } } }, { session });
    });
    return successResponse({ requested: true, message: "Request sent for Superadmin review. Paid access changes only after payment reconciliation." }, 201);
  } catch (error) {
    if (error instanceof EntitlementError) return entitlementErrorResponse(error);
    return errorResponse(error instanceof SyntaxError ? "Enter valid request details." : "Could not request the plan change.", error instanceof SyntaxError ? 400 : 503);
  } finally { if (session) await session.endSession(); }
}
