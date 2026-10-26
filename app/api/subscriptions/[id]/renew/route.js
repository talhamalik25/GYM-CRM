import mongoose from "mongoose";
import connectToDatabase from "../../../../../lib/db";
import { errorResponse, successResponse } from "../../../../../lib/planApiResponse";
import { addDays, dateOnly, deriveSubscriptionStatus, gymToday, isDateOnly } from "../../../../../lib/subscriptionRules";
import { requireApiUser, getRequestGymId, tenantFilter, getRequestScope, getRequestBranchId } from "../../../../../lib/auth";
import Subscription from "../../../../../models/Subscription";
import Member from "../../../../../models/Member";
import Plan from "../../../../../models/Plan";
import Payment from "../../../../../models/Payment";
import generateReceiptNumber from "../../../../../lib/generateReceiptNumber";
import { lockSubscriptionVersion, paymentLedgerErrorResponse, runLedgerTransaction, syncMemberSubscriptionFields } from "../../../../../lib/paymentLedger";
import { isValidIdempotencyKey } from "../../../../../lib/paymentRules";

const methods = ["cash", "bank_transfer", "easypaisa", "jazzcash"];

export async function POST(request, { params }) {
  const auth = await requireApiUser(request);
  if (auth) return auth;
  const { id } = await params;
  if (!mongoose.isObjectIdOrHexString(id)) return errorResponse("Subscription id is invalid.", 400);
  let requestFingerprint;
  let requestKey;
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return errorResponse("Request body must be a JSON object.", 400);
    const key = request.headers.get("Idempotency-Key");
    requestKey = key;
    const fields = {};
    for (const field of Object.keys(body)) if (!["planId", "startDate", "agreedPrice", "amountPaid", "method", "paymentDate"].includes(field)) fields[field] = "This field cannot be changed.";
    if (!isValidIdempotencyKey(key)) fields.idempotencyKey = "A valid request key is required.";
    if (body.planId != null && (typeof body.planId !== "string" || !mongoose.isObjectIdOrHexString(body.planId))) fields.planId = "Choose a valid plan.";
    if (body.agreedPrice != null && (!Number.isSafeInteger(body.agreedPrice) || body.agreedPrice < 1)) fields.agreedPrice = "Price must be positive whole rupees.";
    if (body.amountPaid != null && (!Number.isSafeInteger(body.amountPaid) || body.amountPaid < 0)) fields.amountPaid = "Payment must be a whole number of rupees.";
    if (body.method != null && !methods.includes(body.method)) fields.method = "Choose a valid payment method.";
    if (body.startDate != null && !isDateOnly(body.startDate)) fields.startDate = "Enter a valid date.";
    if (body.paymentDate != null && (!isDateOnly(body.paymentDate) || body.paymentDate > gymToday())) fields.paymentDate = "Choose a valid payment date no later than today.";
    if (Object.keys(fields).length) return errorResponse("Please correct the highlighted fields.", 400, fields);

    await connectToDatabase();
    await Subscription.init();
    await Payment.init();
    requestFingerprint = JSON.stringify({ planId: body.planId || "", startDate: body.startDate || "", agreedPrice: body.agreedPrice ?? null, amountPaid: body.amountPaid ?? 0, method: body.method || "", paymentDate: body.paymentDate || "" });
    const gymId = getRequestGymId(request);
    const scope = getRequestScope(request);
    const result = await runLedgerTransaction(async (session) => {
      const subscription = await Subscription.findOne({ _id: id, ...scope }).session(session);
      if (!subscription) return { missing: true };
      const member = await Member.findOne({ _id: subscription.memberId, ...scope }).session(session);
      if (!member) throw Object.assign(new Error("The subscription member was not found in this gym."), { status: 409 });
      if (member.isActive === false) throw Object.assign(new Error("Reactivate this member account before renewing."), { status: 409 });
      const previousTerm = subscription.renewalHistory.find((term) => term.renewalKey === key);
      if (previousTerm) {
        if (previousTerm.requestFingerprint !== requestFingerprint) throw Object.assign(new Error("This renewal request key was already used for different details."), { status: 409 });
        return { subscription, duplicate: true };
      }
      if (subscription.status === "cancelled") throw Object.assign(new Error("Cancelled subscriptions cannot be renewed."), { status: 409 });
      const today = gymToday();
      const currentStatus = deriveSubscriptionStatus(subscription, today);
      if (currentStatus === "pending") throw Object.assign(new Error("A future subscription cannot be renewed before its term starts."), { status: 409 });
      const latest = subscription.renewalHistory.at(-1);
      const startDate = currentStatus === "active" ? addDays(latest.expiryDate.toISOString().slice(0, 10), 1) : (body.startDate || today);
      if (currentStatus !== "active" && startDate < today) throw Object.assign(new Error("An expired subscription cannot be renewed from a past date."), { status: 400, fields: { startDate: "Choose today or a future date." } });
      const plan = await Plan.findOne({ _id: body.planId || subscription.planId, ...scope }).session(session);
      if (!plan || !plan.isActive) throw Object.assign(new Error("Choose an available active plan."), { status: 400, fields: { planId: "Choose an active plan." } });
      const agreedPrice = body.agreedPrice ?? plan.price;
      const amountPaid = body.amountPaid ?? 0;
      if (!Number.isSafeInteger(agreedPrice) || agreedPrice < 1 || amountPaid > agreedPrice) throw Object.assign(new Error("Enter a valid agreed price and payment amount."), { status: 400, fields: { agreedPrice: "Price must be positive whole rupees.", amountPaid: "Payment cannot exceed price." } });
      if (amountPaid > 0 && !body.method) throw Object.assign(new Error("Choose a payment method."), { status: 400, fields: { method: "A payment method is required with a payment." } });

      const expiryDate = addDays(startDate, plan.durationDays - 1);
      const start = dateOnly(startDate);
      const expiry = dateOnly(expiryDate);
      const planSnapshot = { name: plan.name, durationDays: plan.durationDays, originalPrice: plan.price, agreedPrice };
      let paymentId = null;
      if (amountPaid > 0) {
        const payment = (await Payment.create([{
          gymId, branchId: getRequestBranchId(request),
          memberId: subscription.memberId, planId: plan._id, subscriptionId: subscription._id,
          renewalKey: key, amountDue: agreedPrice, amountPaid, method: body.method,
          paymentDate: dateOnly(body.paymentDate || today), receiptNumber: await generateReceiptNumber({ ...scope }),
          idempotencyKey: key,
          requestFingerprint: JSON.stringify({ subscriptionId: id, renewalKey: key, amountPaid, method: body.method, paymentDate: body.paymentDate || today }),
        }], { session }))[0];
        paymentId = payment._id;
      }
      const term = { renewalKey: key, requestFingerprint, planId: plan._id, planSnapshot, startDate: start, expiryDate: expiry, paymentId };
      await lockSubscriptionVersion(subscription, session, gymId);
      const updated = await Subscription.findOneAndUpdate(
        { _id: id, ...scope, __v: (subscription.__v || 0) + 1, status: { $ne: "cancelled" }, "renewalHistory.renewalKey": { $ne: key } },
        { $push: { renewalHistory: term }, $set: { planId: plan._id, startDate: start, expiryDate: expiry, originalPrice: plan.price, agreedPrice, planSnapshot, status: "pending" }, $inc: { __v: 1 } },
        { returnDocument: "after", session },
      );
      if (!updated) throw Object.assign(new Error("Subscription changed while renewing. Retry with the same request key."), { status: 409 });
      await syncMemberSubscriptionFields(member, session, gymId, {
        planId: plan._id, startDate: start, expiryDate: expiry, membershipCancelled: false,
      });
      return { subscription: updated, duplicate: false };
    });
    if (result.missing) return errorResponse("Subscription was not found.", 404);
    return successResponse(result.subscription.toObject(), result.duplicate ? 200 : 201);
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Request body must be valid JSON.", 400);
    if (error?.status) return errorResponse(error.message, error.status, error.fields);
    const ledgerResponse = paymentLedgerErrorResponse(error, errorResponse);
    if (ledgerResponse) return ledgerResponse;
    if (error?.code === 11000) {
      try {
        const existing = await Subscription.findOne(tenantFilter(request, { _id: id }));
        const term = existing?.renewalHistory.find((entry) => entry.renewalKey === requestKey);
        if (term && term.requestFingerprint === requestFingerprint) return successResponse(existing.toObject(), 200);
        if (term) return errorResponse("This renewal request key was already used for different details.", 409);
      } catch { /* Preserve the safe conflict response below. */ }
      return errorResponse("This renewal request was already processed.", 409);
    }
    console.error("Subscription renewal error:");
    return errorResponse("Could not renew subscription.", 500);
  }
}
