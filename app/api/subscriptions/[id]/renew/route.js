import mongoose from "mongoose";
import connectToDatabase from "../../../../../lib/db";
import { errorResponse, successResponse } from "../../../../../lib/planApiResponse";
import { addDays, dateOnly, deriveSubscriptionStatus, gymToday, isDateOnly } from "../../../../../lib/subscriptionRules";
import { requireApiUser } from "../../../../../lib/auth";
import Subscription from "../../../../../models/Subscription";
import Member from "../../../../../models/Member";
import Plan from "../../../../../models/Plan";
import Payment from "../../../../../models/Payment";
import generateReceiptNumber from "../../../../../lib/generateReceiptNumber";

export async function POST(request, { params }) {
  const auth = await requireApiUser(request); if (auth) return auth;
  const { id } = await params;
  if (!mongoose.isObjectIdOrHexString(id)) return errorResponse("Subscription id is invalid.", 400);
  try {
    const body = await request.json(); const key = request.headers.get("Idempotency-Key"); const fields = {};
    if (!key || !/^[A-Za-z0-9._:-]{16,128}$/.test(key)) fields.idempotencyKey = "A valid request key is required.";
    if (body.amountPaid != null && (!Number.isSafeInteger(body.amountPaid) || body.amountPaid < 0)) fields.amountPaid = "Payment must be a whole number of rupees.";
    if (body.method != null && !["cash", "bank_transfer", "easypaisa", "jazzcash"].includes(body.method)) fields.method = "Choose a valid payment method.";
    if (body.startDate != null && !isDateOnly(body.startDate)) fields.startDate = "Enter a valid date.";
    if (Object.keys(fields).length) return errorResponse("Please correct the highlighted fields.", 400, fields);
    await connectToDatabase();
    const subscription = await Subscription.findById(id);
    if (!subscription) return errorResponse("Subscription was not found.", 404);
    const priorTerm = subscription.renewalHistory.find((term) => term.renewalKey === key);
    if (priorTerm) return successResponse(subscription.toObject(), 200);
    if (subscription.status === "cancelled") return errorResponse("Cancelled subscriptions cannot be renewed.", 409);
    const today = gymToday(); const currentStatus = deriveSubscriptionStatus(subscription, today);
    const latest = subscription.renewalHistory.at(-1);
    const startDate = currentStatus === "active" ? addDays(latest.expiryDate.toISOString().slice(0, 10), 1) : (body.startDate || today);
    if (currentStatus !== "active" && startDate < today) return errorResponse("An expired subscription cannot be renewed from a past date.", 400, { startDate: "Choose today or a future date." });
    const plan = await Plan.findById(body.planId || subscription.planId);
    if (!plan || !plan.isActive) return errorResponse("Choose an available active plan.", 400, { planId: "Choose an active plan." });
    const agreedPrice = body.agreedPrice ?? plan.price; const amountPaid = body.amountPaid ?? 0;
    if (!Number.isSafeInteger(agreedPrice) || agreedPrice < 1 || amountPaid > agreedPrice) return errorResponse("Enter a valid agreed price and payment amount.", 400, { agreedPrice: "Price must be positive whole rupees.", amountPaid: "Payment cannot exceed price." });
    if (amountPaid > 0 && !body.method) return errorResponse("Choose a payment method.", 400, { method: "A payment method is required with a payment." });
    const expiryDate = addDays(startDate, plan.durationDays - 1);
    let paymentId = null;
    if (amountPaid > 0) {
      const existing = await Payment.findOne({ idempotencyKey: key });
      if (existing) {
        if (existing.subscriptionId?.toString() !== id) return errorResponse("This request key was used for another payment.", 409);
        paymentId = existing._id;
      } else {
        const payment = await Payment.create({ memberId: subscription.memberId, planId: plan._id, subscriptionId: subscription._id, renewalKey: key, amountDue: agreedPrice, amountPaid, method: body.method, paymentDate: dateOnly(body.paymentDate || today), receiptNumber: await generateReceiptNumber(), idempotencyKey: key, requestFingerprint: `renewal:${id}:${plan._id}:${agreedPrice}:${amountPaid}:${body.method}` });
        paymentId = payment._id;
      }
    }
    const term = { renewalKey: key, planId: plan._id, planSnapshot: { name: plan.name, durationDays: plan.durationDays, originalPrice: plan.price, agreedPrice }, startDate: dateOnly(startDate), expiryDate: dateOnly(expiryDate), paymentId };
    const updated = await Subscription.findOneAndUpdate({ _id: id, status: { $ne: "cancelled" }, "renewalHistory.renewalKey": { $ne: key } }, { $push: { renewalHistory: term }, $set: { planId: plan._id, startDate: term.startDate, expiryDate: term.expiryDate, originalPrice: plan.price, agreedPrice, planSnapshot: term.planSnapshot, status: "pending" } }, { new: true });
    if (!updated) { const retried = await Subscription.findById(id); if (retried?.renewalHistory.some((entry) => entry.renewalKey === key)) return successResponse(retried.toObject(), 200); return errorResponse("Subscription changed while renewing. Retry with a new request key.", 409); }
    return successResponse(updated.toObject(), 201);
  } catch (error) { if (error instanceof SyntaxError) return errorResponse("Request body must be valid JSON.", 400); if (error?.code === 11000) return errorResponse("This renewal request was already processed.", 409); console.error("Subscription renewal error:", error?.message); return errorResponse("Could not renew subscription.", 500); }
}
