import { issuePlanChangeInvoice } from "../../../../lib/saasBilling.js";
import { lockGym, assertPlanFits, getGymUsage, EntitlementError, entitlementErrorResponse } from "../../../../lib/entitlements.js";
import { listGymBranches } from "../../../../lib/branches.js";
import { LAUNCH_PLANS } from "../../../../lib/saasPlanRules.js";
import mongoose from "mongoose";
import connectToDatabase from "../../../../lib/db.js";
import { getAuthenticatedUserFromRequest, requireSuperadminUser } from "../../../../lib/auth.js";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse.js";
import {
  addBillingInterval, createPlatformInvoiceNumber, invoiceMatchesPendingSubscription, planSnapshot, serializeGymSaaSSubscription, serializePlatformInvoice,
  serializeSaaSPlan, validateInvoiceVoid, validateManualReconciliation, validatePlanAssignment,
  validatePlatformSettings, validateSaaSPlanBody,
} from "../../../../lib/platformBillingRules.js";
import Gym from "../../../../models/Gym.js";
import PlatformInvoice from "../../../../models/PlatformInvoice.js";
import SaaSPlan from "../../../../models/SaaSPlan.js";
import PlatformSetting from "../../../../models/PlatformSetting.js";

function serializeGym(gym) {
  const subscription = gym.saasSubscription
    ? { ...gym.saasSubscription, status: serializeGymSaaSSubscription(gym.saasSubscription).status }
    : null;
  return { id: String(gym._id), name: gym.name, slug: gym.slug, status: gym.status, subscription, planChangeRequest: gym.planChangeRequest || null };
}

async function userIdFromRequest(request) {
  const user = await getAuthenticatedUserFromRequest(request);
  return user?._id || null;
}

async function createInvoice({ gymId, planId, snapshot, periodStart, periodEnd, createdBy, session }) {
  const issuedAt = new Date();
  const [invoice] = await PlatformInvoice.create([{
    invoiceNumber: createPlatformInvoiceNumber(), gymId, planId, planSnapshot: snapshot,
    amountDue: snapshot.price, currency: "PKR", periodStart, periodEnd,
    status: "open", issuedAt, createdBy,
  }], { session });
  return invoice;
}

export async function GET(request) {
  const authResponse = await requireSuperadminUser(request);
  if (authResponse) return authResponse;
  try {
    await connectToDatabase();
    const [plans, gyms, invoices, settings] = await Promise.all([
      SaaSPlan.find({}).sort({ createdAt: -1, _id: 1 }).lean(),
      Gym.find({}).select("name slug status saasSubscription planChangeRequest").sort({ name: 1, _id: 1 }).lean(),
      PlatformInvoice.find({}).populate("gymId", "name").sort({ issuedAt: -1, _id: -1 }).limit(100).lean(),
      PlatformSetting.findById("fitivo").lean(),
    ]);
    return successResponse({ plans: plans.map(serializeSaaSPlan), gyms: await Promise.all(gyms.map(async (gym) => ({ ...serializeGym(gym), usage: await getGymUsage(gym._id), branches: await listGymBranches(gym._id) }))), invoices: invoices.map(serializePlatformInvoice), settings: { defaultTrialDays: settings?.defaultTrialDays ?? 0, manualBillingInstructions: settings?.manualBillingInstructions || "" } });
  } catch {
    console.error("Platform billing data could not be loaded.");
    return errorResponse("Could not load platform billing. Please try again.", 503);
  }
}

export async function POST(request) {
  const authResponse = await requireSuperadminUser(request);
  if (authResponse) return authResponse;
  let body;
  try { body = await request.json(); }
  catch { return errorResponse("Request body must be valid JSON.", 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return errorResponse("Request body must be a JSON object.", 400);
  try { await connectToDatabase(); }
  catch { return errorResponse("Billing service is temporarily unavailable.", 503); }

  if (body.action === "initialize_launch_plans") {
    try {
      await SaaSPlan.init();
      for (const plan of LAUNCH_PLANS) await SaaSPlan.updateOne({ key: plan.key }, { $setOnInsert: { ...plan, currency: "PKR", isActive: true } }, { upsert: true, runValidators: true });
      return successResponse({ initialized: true });
    } catch { return errorResponse("Could not initialize the launch catalog.", 503); }
  }

  if (body.action === "create_plan" || body.action === "update_plan") {
    const updating = body.action === "update_plan";
    if (updating && (typeof body.planId !== "string" || !mongoose.isObjectIdOrHexString(body.planId))) return errorResponse("Plan id is invalid.", 400, { planId: "Choose a valid plan." });
    const payload = { ...body };
    delete payload.action;
    delete payload.planId;
    const validation = validateSaaSPlanBody(payload, { partial: updating });
    if (validation.message) return errorResponse(validation.message, 400, validation.fields);
    try {
      if (validation.name) {
        const duplicateFilter = { name: validation.name, ...(updating ? { _id: { $ne: body.planId } } : {}) };
        if (await SaaSPlan.findOne(duplicateFilter).collation({ locale: "en", strength: 2 }).select("_id").lean()) {
          return errorResponse("A plan with this name already exists.", 409, { name: "Choose a different plan name." });
        }
      }
      const existingPlan = updating ? await SaaSPlan.findById(body.planId).lean() : null;
      if (updating && !existingPlan) return errorResponse("Plan was not found.", 404);
      if (validation.limits && existingPlan) validation.limits = { ...existingPlan.limits, ...validation.limits };
      if (validation.features && existingPlan) validation.features = { ...existingPlan.features, ...validation.features };
      const finalKey = existingPlan?.key || validation.key;
      if (validation.limits?.branches != null && validation.limits.branches < 1) return errorResponse("Every organization must allow at least one branch.", 400);
      if (finalKey && finalKey !== "professional" && (validation.limits?.branches > 1 || ["multiBranch", "branchReports", "consolidatedAnalytics", "prioritySupport"].some((key) => validation.features?.[key]))) return errorResponse("Only Professional can enable organization features or multiple branches.", 400);
      const plan = updating
        ? await SaaSPlan.findByIdAndUpdate(body.planId, { $set: validation }, { new: true, runValidators: true }).lean()
        : await SaaSPlan.create({ ...validation, currency: "PKR", isActive: true });
      if (!plan) return errorResponse("Plan was not found.", 404);
      return successResponse({ plan: serializeSaaSPlan(plan) }, updating ? 200 : 201);
    } catch {
      return errorResponse("Could not save the subscription plan.", 503);
    }
  }

  if (body.action === "update_settings") {
    const payload = { ...body }; delete payload.action;
    const validation = validatePlatformSettings(payload);
    if (validation.message) return errorResponse(validation.message, 400, validation.fields);
    try {
      const settings = await PlatformSetting.findByIdAndUpdate("fitivo", { $set: validation }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }).lean();
      return successResponse({ settings: { defaultTrialDays: settings.defaultTrialDays, manualBillingInstructions: settings.manualBillingInstructions || "" } });
    } catch { return errorResponse("Could not save platform billing settings.", 503); }
  }

  const actorId = await userIdFromRequest(request);
  if (!actorId) return errorResponse("The superadmin session could not be verified.", 401);

  if (body.action === "assign_plan") {
    const payload = { ...body }; delete payload.action;
    const validation = validatePlanAssignment(payload);
    if (validation.message) return errorResponse(validation.message, 400, validation.fields);
    if (validation.mode === "trial") return errorResponse("Seven-day trials are assigned only during new gym provisioning. Existing gyms cannot receive another trial.", 409);
    try {
      const result = await issuePlanChangeInvoice(validation.gymId, validation.planId, actorId);
      return successResponse({ gym: serializeGym(result.gym), invoice: serializePlatformInvoice(result.invoice) }, 201);
    } catch (error) {
      if (error instanceof EntitlementError) return entitlementErrorResponse(error);
      return errorResponse("Could not issue the plan change invoice.", 503);
    }
  }

  if (body.action === "renew_invoice") {
    if (typeof body.gymId !== "string" || !mongoose.isObjectIdOrHexString(body.gymId)) return errorResponse("Gym id is invalid.", 400, { gymId: "Choose a valid Gym." });
    try {
      const gym = await Gym.findOne({ _id: body.gymId, status: "active" }).lean();
      const subscription = gym?.saasSubscription;
      if (!subscription || subscription.status === "cancelled") return errorResponse("This Gym has no renewable SaaS subscription.", 409);
      if (subscription.planSnapshot.price === 0) return errorResponse("Free subscriptions do not need invoices.", 400);
      if (subscription.pendingInvoiceId && await PlatformInvoice.exists({ _id: subscription.pendingInvoiceId, status: "open" })) return errorResponse("An open invoice already exists for this Gym.", 409);
      const now = new Date();
      const periodStart = subscription.periodEnd && subscription.periodEnd > now ? subscription.periodEnd : now;
      const periodEnd = addBillingInterval(periodStart, subscription.planSnapshot.interval);
      const session = await mongoose.startSession();
      let invoice;
      try {
        await session.withTransaction(async () => {
          invoice = await createInvoice({ gymId: gym._id, planId: subscription.planId, snapshot: subscription.planSnapshot, periodStart, periodEnd, createdBy: actorId, session });
          const updated = await Gym.updateOne({ _id: gym._id, "saasSubscription.pendingInvoiceId": subscription.pendingInvoiceId || null }, { $set: { "saasSubscription.pendingInvoiceId": invoice._id } }, { session });
          if (updated.modifiedCount !== 1) throw new Error("Subscription changed; retry invoice creation.");
        });
      } finally { await session.endSession(); }
      return successResponse({ invoice: serializePlatformInvoice(invoice) }, 201);
    } catch {
      return errorResponse("Could not issue the renewal invoice. Please try again.", 503);
    }
  }

  if (body.action === "reconcile_invoice") {
    if (typeof body.invoiceId !== "string" || !mongoose.isObjectIdOrHexString(body.invoiceId)) return errorResponse("Invoice id is invalid.", 400, { invoiceId: "Choose a valid invoice." });
    const validation = validateManualReconciliation({ paymentReference: body.paymentReference });
    if (validation.message) return errorResponse(validation.message, 400, validation.fields);
    const session = await mongoose.startSession();
    let reconciled;
    try {
      await session.withTransaction(async () => {
        const invoice = await PlatformInvoice.findOne({ _id: body.invoiceId, status: "open" }).session(session);
        if (!invoice) throw new Error("Invoice is missing or is not open.");
        const gym = await lockGym(invoice.gymId, session);
        if (!gym || !invoiceMatchesPendingSubscription(gym.saasSubscription, invoice)) throw new Error("Invoice does not match the Gym's pending subscription.");
        await assertPlanFits(gym._id, invoice.planSnapshot, session);
        invoice.status = "paid";
        invoice.paidAt = new Date();
        // New public gyms receive a usable paid term even when manual payment
        // verification happens long after issuance. Preserve legacy terms.
        if (invoice.changesPlan || gym.publicTrial?.version === 1) {
          invoice.periodStart = invoice.changesPlan ? invoice.paidAt : new Date(Math.max(invoice.periodStart.getTime(), invoice.paidAt.getTime()));
          invoice.periodEnd = addBillingInterval(invoice.periodStart, invoice.planSnapshot.interval);
        }
        const current = gym.saasSubscription;
        const accessStart = !invoice.changesPlan && current.status === "active"
          && current.periodStart <= invoice.paidAt && current.periodEnd > invoice.paidAt
          && current.periodEnd >= invoice.periodStart ? current.periodStart : invoice.periodStart;
        invoice.paymentReference = validation.paymentReference;
        invoice.reconciledBy = actorId;
        await invoice.save({ session });
        const subscriptionUpdate = await Gym.updateOne({ _id: invoice.gymId, "saasSubscription.pendingInvoiceId": invoice._id }, { $set: {
          "saasSubscription.planId": invoice.planId, "saasSubscription.planSnapshot": invoice.planSnapshot,
          "saasSubscription.status": "active", "saasSubscription.periodStart": accessStart,
          "saasSubscription.periodEnd": invoice.periodEnd, "saasSubscription.renewalDate": invoice.periodEnd,
          "saasSubscription.trialStartedAt": null, "saasSubscription.trialEndsAt": null,
          "saasSubscription.pendingInvoiceId": null,
        } }, { session });
        if (subscriptionUpdate.modifiedCount !== 1) throw new Error("Invoice is no longer pending for this Gym subscription.");
        reconciled = invoice.toObject();
      });
    } catch (error) {
      await session.endSession();
      if (error instanceof EntitlementError) return entitlementErrorResponse(error);
      if (error.message === "Invoice is missing or is not open.") return errorResponse(error.message, 409);
      if (error.message === "Invoice does not match the Gym's pending subscription.") return errorResponse(error.message, 409);
      return errorResponse("Could not reconcile this invoice. Please try again.", 503);
    }
    await session.endSession();
    return successResponse({ invoice: serializePlatformInvoice(reconciled) });
  }

  if (body.action === "void_invoice") {
    if (typeof body.invoiceId !== "string" || !mongoose.isObjectIdOrHexString(body.invoiceId)) return errorResponse("Invoice id is invalid.", 400, { invoiceId: "Choose a valid invoice." });
    const validation = validateInvoiceVoid({ reason: body.reason });
    if (validation.message) return errorResponse(validation.message, 400, validation.fields);
    const session = await mongoose.startSession();
    let voided;
    try {
      await session.withTransaction(async () => {
        const invoice = await PlatformInvoice.findOne({ _id: body.invoiceId, status: "open" }).session(session);
        if (!invoice) throw new Error("Invoice is missing or is not open.");
        invoice.status = "void";
        invoice.voidedAt = new Date();
        invoice.voidedBy = actorId;
        invoice.voidReason = validation.reason;
        await invoice.save({ session });
        await Gym.updateOne({ _id: invoice.gymId, "saasSubscription.pendingInvoiceId": invoice._id }, { $set: { "saasSubscription.pendingInvoiceId": null } }, { session });
        voided = invoice.toObject();
      });
    } catch (error) {
      await session.endSession();
      if (error instanceof EntitlementError) return entitlementErrorResponse(error);
      if (error.message === "Invoice is missing or is not open.") return errorResponse(error.message, 409);
      return errorResponse("Could not void this invoice. Please try again.", 503);
    }
    await session.endSession();
    return successResponse({ invoice: serializePlatformInvoice(voided) });
  }

  if (body.action === "cancel_subscription") {
    if (typeof body.gymId !== "string" || !mongoose.isObjectIdOrHexString(body.gymId)) return errorResponse("Gym id is invalid.", 400, { gymId: "Choose a valid Gym." });
    try {
      const existing = await Gym.findOne({ _id: body.gymId, "saasSubscription.planId": { $exists: true } }).select("saasSubscription.pendingInvoiceId").lean();
      if (existing?.saasSubscription?.pendingInvoiceId && await PlatformInvoice.exists({ _id: existing.saasSubscription.pendingInvoiceId, status: "open" })) return errorResponse("Void or reconcile the open invoice before cancelling this subscription.", 409);
      const gym = await Gym.findOneAndUpdate({ _id: body.gymId, "saasSubscription.planId": { $exists: true }, "saasSubscription.pendingInvoiceId": null }, { $set: { "saasSubscription.status": "cancelled", "saasSubscription.autoRenew": false } }, { new: true, runValidators: true }).select("name slug status saasSubscription planChangeRequest").lean();
      if (!gym) return errorResponse("Gym SaaS subscription was not found.", 404);
      return successResponse({ gym: serializeGym(gym) });
    } catch { return errorResponse("Could not cancel this SaaS subscription.", 503); }
  }

  return errorResponse("Choose a supported billing action.", 400, { action: "Unsupported action." });
}
