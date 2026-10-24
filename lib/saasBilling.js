import mongoose from "mongoose";
import Gym from "../models/Gym.js";
import SaaSPlan from "../models/SaaSPlan.js";
import PlatformInvoice from "../models/PlatformInvoice.js";
import { addBillingInterval, createPlatformInvoiceNumber, planSnapshot } from "./platformBillingRules.js";
import { assertPlanFits, lockGym, EntitlementError } from "./entitlements.js";

export async function issuePlanChangeInvoice(gymId, planId, actorId) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const gym = await lockGym(gymId, session);
      if (gym.status !== "active") throw new EntitlementError("An active gym is required.", "GYM_UNAVAILABLE", 409);
      const plan = await SaaSPlan.findOne({ _id: planId, isActive: true }).session(session).lean();
      if (!plan || plan.price === 0) throw new EntitlementError("Choose an active paid plan. Complimentary access uses its separate grant workflow.", "INVALID_PLAN", 400);
      if (gym.saasSubscription?.pendingInvoiceId) throw new EntitlementError("Reconcile or void the pending invoice first.", "INVOICE_PENDING", 409);
      const snapshot = planSnapshot(plan);
      await assertPlanFits(gymId, snapshot, session);
      const now = new Date();
      const periodEnd = addBillingInterval(now, plan.interval);
      const [invoice] = await PlatformInvoice.create([{
        invoiceNumber: createPlatformInvoiceNumber(), gymId, planId, planSnapshot: snapshot,
        previousPlanSnapshot: gym.saasSubscription?.planSnapshot,
        amountDue: plan.price, currency: "PKR", periodStart: now, periodEnd,
        changesPlan: true, status: "open", issuedAt: now, createdBy: actorId,
      }], { session });
      const update = gym.saasSubscription ? { "saasSubscription.pendingInvoiceId": invoice._id } : {
        saasSubscription: { planId, planSnapshot: snapshot, status: "past_due", periodStart: now, periodEnd, pendingInvoiceId: invoice._id, autoRenew: false },
      };
      const updated = await Gym.findByIdAndUpdate(gymId, { $set: update, $unset: { planChangeRequest: 1 } }, { new: true, session, runValidators: true }).lean();
      result = { gym: updated, invoice: invoice.toObject() };
    });
    return result;
  } finally { await session.endSession(); }
}
