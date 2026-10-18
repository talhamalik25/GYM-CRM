import mongoose from "mongoose";
import connectToDatabase from "../../../../lib/db";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse";
import { dateOnly, deriveSubscriptionStatus } from "../../../../lib/subscriptionRules";
import { requireApiUser, tenantFilter } from "../../../../lib/auth";
import Subscription from "../../../../models/Subscription";
import { GET as listSubscriptions } from "../route";

async function responseFor(subscription, request) {
  const s = subscription.toObject ? subscription.toObject() : subscription;
  const [member, plan, payments] = await Promise.all([
    (await import("../../../../models/Member")).default.findOne(tenantFilter(request, { _id: s.memberId })).select("fullName phone email").lean(),
    (await import("../../../../models/Plan")).default.findOne(tenantFilter(request, { _id: s.planId })).select("name").lean(),
    (await import("../../../../models/Payment")).default.find(tenantFilter(request, { subscriptionId: s._id })).sort({ paymentDate: 1 }).lean(),
  ]);
  const amountDue = s.renewalHistory.reduce((sum, term) => sum + term.planSnapshot.agreedPrice, 0);
  const amountPaid = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);
  return { ...s, _id: String(s._id), memberId: String(s.memberId), planId: String(s.planId), member, plan, status: deriveSubscriptionStatus(s), amountDue, amountPaid, balance: Math.max(0, amountDue - amountPaid), paymentStatus: amountPaid >= amountDue ? "paid" : amountPaid ? "partial" : "pending", payments };
}

export async function GET(request, { params }) {
  const auth = await requireApiUser(request); if (auth) return auth;
  const { id } = await params;
  if (!mongoose.isObjectIdOrHexString(id)) return errorResponse("Subscription id is invalid.", 400);
  try { await connectToDatabase(); const subscription = await Subscription.findOne(tenantFilter(request, { _id: id })); return subscription ? successResponse(await responseFor(subscription, request)) : errorResponse("Subscription was not found.", 404); }
  catch (error) { console.error("Subscription API error:", error?.message); return errorResponse("Could not load subscription.", 500); }
}

export async function PATCH(request, { params }) {
  const auth = await requireApiUser(request); if (auth) return auth;
  const { id } = await params;
  if (!mongoose.isObjectIdOrHexString(id)) return errorResponse("Subscription id is invalid.", 400);
  try {
    const body = await request.json();
    if (body?.status !== "cancelled" || Object.keys(body).some((key) => key !== "status")) return errorResponse("Only cancellation is supported.", 400, { status: "Set status to cancelled." });
    await connectToDatabase();
    const subscription = await Subscription.findOneAndUpdate(tenantFilter(request, { _id: id, status: { $ne: "cancelled" } }), { $set: { status: "cancelled" } }, { new: true });
    if (!subscription) { const existing = await Subscription.findOne(tenantFilter(request, { _id: id })); return existing ? errorResponse("Subscription is already cancelled.", 409) : errorResponse("Subscription was not found.", 404); }
    return successResponse(await responseFor(subscription, request));
  } catch (error) { if (error instanceof SyntaxError) return errorResponse("Request body must be valid JSON.", 400); console.error("Subscription API error:", error?.message); return errorResponse("Could not update subscription.", 500); }
}
