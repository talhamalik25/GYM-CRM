import mongoose from "mongoose";
import connectToDatabase from "../../../../lib/db.js";
import { getAuthenticatedUserFromRequest, requireSuperadminUser } from "../../../../lib/auth.js";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse.js";
import {
  addBillingInterval, createPlatformInvoiceNumber, planSnapshot, serializePlatformInvoice,
  serializeSaaSPlan, validateInvoiceVoid, validateManualReconciliation, validatePlanAssignment,
  validatePlatformSettings, validateSaaSPlanBody,
} from "../../../../lib/platformBillingRules.js";
import Gym from "../../../../models/Gym.js";
import PlatformInvoice from "../../../../models/PlatformInvoice.js";
import SaaSPlan from "../../../../models/SaaSPlan.js";
import PlatformSetting from "../../../../models/PlatformSetting.js";

function serializeGym(gym) {
  return { id: String(gym._id), name: gym.name, slug: gym.slug, status: gym.status, subscription: gym.saasSubscription || null };
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
      Gym.find({}).select("name slug status saasSubscription").sort({ name: 1, _id: 1 }).lean(),
      PlatformInvoice.find({}).populate("gymId", "name").sort({ issuedAt: -1, _id: -1 }).limit(100).lean(),
      PlatformSetting.findById("fitivo").lean(),
    ]);
    return successResponse({ plans: plans.map(serializeSaaSPlan), gyms: gyms.map(serializeGym), invoices: invoices.map(serializePlatformInvoice), settings: { defaultTrialDays: settings?.defaultTrialDays ?? 0, manualBillingInstructions: settings?.manualBillingInstructions || "" } });
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
    const validation = validatePlanAssignment(body);
    if (validation.message) return errorResponse(validation.message, 400, validation.fields);
    try {
      const [gym, plan] = await Promise.all([
        Gym.findOne({ _id: validation.gymId, status: "active" }).lean(),
        SaaSPlan.findOne({ _id: validation.planId, isActive: true }).lean(),
      ]);
      if (!gym) return errorResponse("Active Gym was not found.", 404);
      if (!plan) return errorResponse("An active SaaS plan is required.", 400, { planId: "Choose an active plan." });
      if (gym.saasSubscription?.pendingInvoiceId && await PlatformInvoice.exists({ _id: gym.saasSubscription.pendingInvoiceId, status: "open" })) {
        return errorResponse("Reconcile or void the existing open invoice before changing this subscription.", 409);
      }
      const snapshot = planSnapshot(plan);
      const now = new Date();
      if (validation.mode === "trial") {
        const trialEndsAt = new Date(now.getTime() + validation.trialDays * 86400000);
        const updated = await Gym.findOneAndUpdate({ _id: gym._id }, { $set: { saasSubscription: {
          planId: plan._id, planSnapshot: snapshot, status: "trialing", periodStart: null, periodEnd: null,
          trialEndsAt, renewalDate: trialEndsAt, pendingInvoiceId: null, autoRenew: false,
        } } }, { new: true, runValidators: true }).select("name slug status saasSubscription").lean();
        return successResponse({ gym: serializeGym(updated), invoice: null });
      }
      const periodStart = gym.saasSubscription?.status === "active" && gym.saasSubscription.periodEnd > now
        ? gym.saasSubscription.periodEnd : now;
      const periodEnd = addBillingInterval(periodStart, plan.interval);
      if (plan.price === 0) {
        const updated = await Gym.findOneAndUpdate({ _id: gym._id }, { $set: { saasSubscription: {
          planId: plan._id, planSnapshot: snapshot, status: "active", periodStart, periodEnd,
          trialEndsAt: null, renewalDate: periodEnd, pendingInvoiceId: null, autoRenew: false,
        } } }, { new: true, runValidators: true }).select("name slug status saasSubscription").lean();
        return successResponse({ gym: serializeGym(updated), invoice: null });
      }
      const session = await mongoose.startSession();
      let updatedGym;
      let invoice;
      try {
        await session.withTransaction(async () => {
          invoice = await createInvoice({ gymId: gym._id, planId: plan._id, snapshot, periodStart, periodEnd, createdBy: actorId, session });
          updatedGym = await Gym.findOneAndUpdate({ _id: gym._id }, { $set: { saasSubscription: {
            planId: plan._id, planSnapshot: snapshot, status: "past_due", periodStart, periodEnd,
            trialEndsAt: null, renewalDate: periodEnd, pendingInvoiceId: invoice._id, autoRenew: false,
          } } }, { new: true, runValidators: true, session }).select("name slug status saasSubscription").lean();
          if (!updatedGym) throw new Error("Active Gym was not found.");
        });
      } finally { await session.endSession(); }
      return successResponse({ gym: serializeGym(updatedGym), invoice: serializePlatformInvoice(invoice) }, 201);
    } catch {
      return errorResponse("Could not assign the SaaS plan. Please try again.", 503);
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
        invoice.status = "paid";
        invoice.paidAt = new Date();
        invoice.paymentReference = validation.paymentReference;
        invoice.reconciledBy = actorId;
        await invoice.save({ session });
        const subscriptionUpdate = await Gym.updateOne({ _id: invoice.gymId, "saasSubscription.pendingInvoiceId": invoice._id }, { $set: {
          "saasSubscription.status": "active", "saasSubscription.periodStart": invoice.periodStart,
          "saasSubscription.periodEnd": invoice.periodEnd, "saasSubscription.renewalDate": invoice.periodEnd,
          "saasSubscription.trialEndsAt": null, "saasSubscription.pendingInvoiceId": null,
        } }, { session });
        if (subscriptionUpdate.modifiedCount !== 1) throw new Error("Invoice is no longer pending for this Gym subscription.");
        reconciled = invoice.toObject();
      });
    } catch (error) {
      await session.endSession();
      if (error.message === "Invoice is missing or is not open.") return errorResponse(error.message, 409);
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
      if (error.message === "Invoice is missing or is not open.") return errorResponse(error.message, 409);
      return errorResponse("Could not void this invoice. Please try again.", 503);
    }
    await session.endSession();
    return successResponse({ invoice: serializePlatformInvoice(voided) });
  }

  if (body.action === "cancel_subscription") {
    if (typeof body.gymId !== "string" || !mongoose.isObjectIdOrHexString(body.gymId)) return errorResponse("Gym id is invalid.", 400, { gymId: "Choose a valid Gym." });
    try {
      const gym = await Gym.findOneAndUpdate({ _id: body.gymId, "saasSubscription.planId": { $exists: true } }, { $set: { "saasSubscription.status": "cancelled", "saasSubscription.autoRenew": false } }, { new: true, runValidators: true }).select("name slug status saasSubscription").lean();
      if (!gym) return errorResponse("Gym SaaS subscription was not found.", 404);
      return successResponse({ gym: serializeGym(gym) });
    } catch { return errorResponse("Could not cancel this SaaS subscription.", 503); }
  }

  return errorResponse("Choose a supported billing action.", 400, { action: "Unsupported action." });
}
