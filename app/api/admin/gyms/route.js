import mongoose from "mongoose";
import connectToDatabase from "../../../../lib/db.js";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse.js";
import { addBillingInterval, createPlatformInvoiceNumber, planSnapshot, serializePlatformInvoice } from "../../../../lib/platformBillingRules.js";
import { getAuthenticatedUserFromRequest } from "../../../../lib/auth.js";
import { requireSuperadminUser } from "../../../../lib/auth.js";
import { ensureNoConflictingGymMembership, GymProvisioningError, lockOwnerAccountForAssignment, serializeAdminGym, validateGymProvisioning } from "../../../../lib/adminGymRules.js";
import Gym from "../../../../models/Gym.js";
import GymMembership from "../../../../models/GymMembership.js";
import PlatformInvoice from "../../../../models/PlatformInvoice.js";
import PlatformSetting from "../../../../models/PlatformSetting.js";
import SaaSPlan from "../../../../models/SaaSPlan.js";
import User from "../../../../models/User.js";

export async function GET(request) {
  const authResponse = await requireSuperadminUser(request);
  if (authResponse) return authResponse;

  try {
    await connectToDatabase();
    const gyms = await Gym.find({}).select("name slug status timezone saasSubscription saasAccessRequired createdAt updatedAt").sort({ createdAt: -1, _id: 1 }).lean();
    const memberships = gyms.length ? await GymMembership.find({
      gymId: { $in: gyms.map(({ _id }) => _id) }, role: "gym_owner", status: "active",
    }).select("gymId userId").populate({ path: "userId", match: { isActive: { $ne: false } }, select: "fullName email" }).lean() : [];
    const ownersByGym = new Map();
    for (const membership of memberships) {
      const key = String(membership.gymId);
      ownersByGym.set(key, [...(ownersByGym.get(key) || []), membership]);
    }
    return successResponse({ items: gyms.map((gym) => serializeAdminGym(gym, ownersByGym.get(String(gym._id)))) });
  } catch {
    console.error("Admin gym list could not be loaded.");
    return errorResponse("Could not load gym accounts. Please try again.", 503);
  }
}

export async function POST(request) {
  const authResponse = await requireSuperadminUser(request);
  if (authResponse) return authResponse;
  let body;
  try { body = await request.json(); }
  catch { return errorResponse("Request body must be valid JSON.", 400); }
  let session;
  try {
    await connectToDatabase();
    const platformSettings = await PlatformSetting.findById("fitivo").select("defaultTrialDays").lean();
    const validation = validateGymProvisioning(body, { defaultTrialDays: platformSettings?.defaultTrialDays ?? 0 });
    if (validation.message) return errorResponse(validation.message, 400, validation.fields);
    const actor = await getAuthenticatedUserFromRequest(request);
    session = await mongoose.startSession();
    let createdGym;
    let createdInvoice = null;
    await session.withTransaction(async () => {
      const owner = await User.findOne({ email: validation.ownerEmail, role: "staff", isActive: true })
        .select("_id fullName email role isActive __v").session(session);
      if (!owner) throw new GymProvisioningError("An active staff account with this email was not found.", 404, { ownerEmail: "Choose an existing active staff account." });
      await lockOwnerAccountForAssignment(owner, session, User);
      await ensureNoConflictingGymMembership(owner._id, session, GymMembership);
      const now = new Date();
      let saasSubscription;
      let invoiceTerms = null;
      if (validation.accessMode !== "none") {
        const plan = await SaaSPlan.findOne({ _id: validation.planId, isActive: true }).session(session).lean();
        if (!plan) throw new GymProvisioningError("An active SaaS plan was not found.", 400, { planId: "Choose an active SaaS plan." });
        const snapshot = planSnapshot(plan);
        if (validation.accessMode === "trial") {
          const trialEndsAt = new Date(now.getTime() + validation.trialDays * 86400000);
          saasSubscription = {
            planId: plan._id, planSnapshot: snapshot, status: "trialing", trialStartedAt: now,
            trialEndsAt, renewalDate: trialEndsAt, periodStart: null, periodEnd: null,
            pendingInvoiceId: null, autoRenew: false,
          };
        } else if (plan.price === 0) {
          const periodEnd = addBillingInterval(now, plan.interval);
          saasSubscription = {
            planId: plan._id, planSnapshot: snapshot, status: "active", trialStartedAt: null,
            trialEndsAt: null, periodStart: now, periodEnd, renewalDate: periodEnd,
            pendingInvoiceId: null, autoRenew: false,
          };
        } else {
          const periodEnd = addBillingInterval(now, plan.interval);
          invoiceTerms = { planId: plan._id, snapshot, periodStart: now, periodEnd };
          saasSubscription = {
            planId: plan._id, planSnapshot: snapshot, status: "past_due", trialStartedAt: null,
            trialEndsAt: null, periodStart: now, periodEnd, renewalDate: periodEnd,
            pendingInvoiceId: null, autoRenew: false,
          };
        }
      }
      const [gym] = await Gym.create([{
        name: validation.name, slug: validation.slug, timezone: validation.timezone, status: "active",
        saasAccessRequired: true, ...(saasSubscription ? { saasSubscription } : {}),
      }], { session });
      if (invoiceTerms) {
        [createdInvoice] = await PlatformInvoice.create([{
          invoiceNumber: createPlatformInvoiceNumber(), gymId: gym._id, planId: invoiceTerms.planId,
          planSnapshot: invoiceTerms.snapshot, amountDue: invoiceTerms.snapshot.price, currency: "PKR",
          periodStart: invoiceTerms.periodStart, periodEnd: invoiceTerms.periodEnd, status: "open",
          issuedAt: now, createdBy: actor._id,
        }], { session });
        gym.saasSubscription.pendingInvoiceId = createdInvoice._id;
        await gym.save({ session });
      }
      await GymMembership.create([{ userId: owner._id, gymId: gym._id, role: "gym_owner", status: "active" }], { session });
      createdGym = { ...serializeAdminGym(gym, [{ userId: owner }]), subscription: gym.saasSubscription || null, saasAccessRequired: true };
    });
    return successResponse({ gym: createdGym, invoice: createdInvoice ? serializePlatformInvoice(createdInvoice) : null }, 201);
  } catch (error) {
    if (error instanceof GymProvisioningError) return errorResponse(error.message, error.status, Object.keys(error.fields).length ? error.fields : undefined);
    if (error?.code === 11000) return errorResponse(error.keyPattern?.slug ? "A Gym already uses this URL slug." : "This owner account already has a Gym assignment.", 409, error.keyPattern?.slug ? { slug: "Choose a different URL slug." } : { ownerEmail: "Refresh and check this account's current Gym assignment." });
    if (error?.code === 20 || error?.codeName === "IllegalOperation" || /replica set|transaction numbers are only allowed/i.test(error?.message || "")) {
      return errorResponse("Atomic Gym provisioning requires MongoDB transaction support. Configure a replica-set MongoDB deployment.", 503);
    }
    console.error("Gym provisioning could not be completed:", error?.message);
    return errorResponse("Could not provision the Gym. No partial Gym or owner assignment was retained.", 503);
  } finally {
    if (session) await session.endSession();
  }
}
