import { writeAuditLog } from "../../../../lib/auditLog.js";
import { readJsonBody, RequestBodyError, requestBodyErrorResponse } from "../../../../lib/requestBody.js";
import mongoose from "mongoose";
import connectToDatabase from "../../../../lib/db";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse";
import { deriveSubscriptionStatus } from "../../../../lib/subscriptionRules";
import { requireApiUser, getRequestActorId, tenantFilter, getRequestGymId, getRequestScope, } from "../../../../lib/auth";
import Subscription from "../../../../models/Subscription";
import Member from "../../../../models/Member";
import { paymentLedgerErrorResponse, runLedgerTransaction } from "../../../../lib/paymentLedger";
import { GET as listSubscriptions } from "../route";

async function responseFor(subscription, request) {
  const s = subscription.toObject ? subscription.toObject() : subscription;
  const [member, plan, payments] = await Promise.all([
    (await import("../../../../models/Member")).default.findOne(tenantFilter(request, { _id: s.memberId })).select("fullName phone email").lean(),
    (await import("../../../../models/Plan")).default.findOne(tenantFilter(request, { _id: s.planId })).select("name").lean(),
    (await import("../../../../models/Payment")).default.find(tenantFilter(request, { voided: { $ne: true }, subscriptionId: s._id })).sort({ paymentDate: 1 }).lean(),
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
  catch (error) {
    if (error instanceof RequestBodyError) return requestBodyErrorResponse(error); console.error("Subscription API error:"); return errorResponse("Could not load subscription.", 500); }
}

export async function PATCH(request, { params }) {
  const auth = await requireApiUser(request); if (auth) return auth;
  const { id } = await params;
  if (!mongoose.isObjectIdOrHexString(id)) return errorResponse("Subscription id is invalid.", 400);
  try {
    const body = await readJsonBody(request);
    if (body?.status !== "cancelled" || Object.keys(body).some((key) => key !== "status")) return errorResponse("Only cancellation is supported.", 400, { status: "Set status to cancelled." });
    await connectToDatabase();
    const gymId = getRequestGymId(request);
    const scope = getRequestScope(request);
    const result = await runLedgerTransaction(async (session) => {
      const current = await Subscription.findOne({ _id: id, ...scope }).session(session);
      if (!current) return { missing: true };
      if (current.status === "cancelled") return { alreadyCancelled: true };
      const member = await Member.findOne({ _id: current.memberId, ...scope }).session(session);
      if (!member) throw Object.assign(new Error("The subscription member was not found in this gym."), { status: 409 });
      current.status = "cancelled";
      const saved = await Subscription.updateOne({ _id: current._id, gymId, status: { $ne: "cancelled" } }, { $set: { status: "cancelled" } }, { session, runValidators: true });
      if (saved.modifiedCount !== 1) throw Object.assign(new Error("Subscription changed while cancelling."), { status: 409 });
      const latestTerm = current.renewalHistory.at(-1);
      const memberExpiry = member.expiryDate instanceof Date ? member.expiryDate.toISOString().slice(0, 10) : String(member.expiryDate).slice(0, 10);
      const termExpiry = latestTerm?.expiryDate instanceof Date ? latestTerm.expiryDate.toISOString().slice(0, 10) : String(latestTerm?.expiryDate || "").slice(0, 10);
      const representsCurrentMembership = String(member.planId) === String(current.planId) && memberExpiry === termExpiry;
      const memberStart = member.startDate instanceof Date ? member.startDate.toISOString().slice(0, 10) : String(member.startDate).slice(0, 10);
      const termStart = latestTerm?.startDate instanceof Date ? latestTerm.startDate.toISOString().slice(0, 10) : String(latestTerm?.startDate || "").slice(0, 10);
      if (representsCurrentMembership && memberStart === termStart) {
        await Member.updateOne({ _id: member._id, ...scope }, { $set: { membershipCancelled: true }, $inc: { __v: 1 } }, { session });
        await writeAuditLog({ gymId, actorId: getRequestActorId(request), action: "member.edited", resourceId: member._id, changedFields: ["membershipCancelled"] }, session);
      }
      return { subscription: current };
    });
    if (result.missing) return errorResponse("Subscription was not found.", 404);
    if (result.alreadyCancelled) return errorResponse("Subscription is already cancelled.", 409);
    return successResponse(await responseFor(result.subscription, request));
  } catch (error) {
    if (error instanceof RequestBodyError) return requestBodyErrorResponse(error); if (error instanceof SyntaxError) return errorResponse("Request body must be valid JSON.", 400); if (error?.status) return errorResponse(error.message, error.status); const ledgerResponse = paymentLedgerErrorResponse(error, errorResponse); if (ledgerResponse) return ledgerResponse; console.error("Subscription API error:"); return errorResponse("Could not update subscription.", 500); }
}
