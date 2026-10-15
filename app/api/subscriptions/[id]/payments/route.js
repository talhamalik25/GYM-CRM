import mongoose from "mongoose";
import connectToDatabase from "../../../../../lib/db";
import { errorResponse, successResponse } from "../../../../../lib/planApiResponse";
import { dateOnly, gymToday, isDateOnly } from "../../../../../lib/subscriptionRules";
import { requireApiUser } from "../../../../../lib/auth";
import Subscription from "../../../../../models/Subscription";
import Payment from "../../../../../models/Payment";
import generateReceiptNumber from "../../../../../lib/generateReceiptNumber";

export async function POST(request, { params }) {
  const auth = await requireApiUser(request); if (auth) return auth;
  const { id } = await params;
  if (!mongoose.isObjectIdOrHexString(id)) return errorResponse("Subscription id is invalid.", 400);
  try {
    const body = await request.json(); const key = request.headers.get("Idempotency-Key"); const fields = {};
    if (!Number.isSafeInteger(body.amountPaid) || body.amountPaid <= 0) fields.amountPaid = "Payment must be a positive whole number of rupees.";
    if (!["cash", "bank_transfer", "easypaisa", "jazzcash"].includes(body.method)) fields.method = "Choose a valid payment method.";
    if (body.paymentDate != null && !isDateOnly(body.paymentDate)) fields.paymentDate = "Enter a valid payment date.";
    if (!key || !/^[A-Za-z0-9._:-]{16,128}$/.test(key)) fields.idempotencyKey = "A valid request key is required.";
    if (Object.keys(fields).length) return errorResponse("Please correct the highlighted fields.", 400, fields);
    await connectToDatabase(); await Payment.init();
    const fingerprint = `subscription-payment:${id}:${body.amountPaid}:${body.method}:${body.paymentDate || gymToday()}`;
    const previousRequest = await Payment.findOne({ idempotencyKey: key }).select("+requestFingerprint");
    if (previousRequest) return previousRequest.requestFingerprint === fingerprint ? successResponse({ _id: String(previousRequest._id), receiptNumber: previousRequest.receiptNumber }, 200) : errorResponse("This request key was used for different payment details.", 409);
    const subscription = await Subscription.findById(id);
    if (!subscription) return errorResponse("Subscription was not found.", 404);
    const renewalKey = body.renewalKey || subscription.renewalHistory.at(-1)?.renewalKey;
    const term = subscription.renewalHistory.find((entry) => entry.renewalKey === renewalKey);
    if (!term) return errorResponse("Renewal term was not found.", 404, { renewalKey: "Choose a valid term." });
    const payments = await Payment.find({ subscriptionId: id, renewalKey }).select("amountPaid").lean();
    const paid = payments.reduce((total, payment) => total + payment.amountPaid, 0); const remaining = term.planSnapshot.agreedPrice - paid;
    if (body.amountPaid > remaining) return errorResponse("Payment exceeds the outstanding balance.", 400, { amountPaid: `Outstanding balance is Rs. ${Math.max(remaining, 0)}.` });
    const paymentDate = body.paymentDate || gymToday();
    if (paymentDate > gymToday()) return errorResponse("Payment date cannot be in the future.", 400, { paymentDate: "Choose today or an earlier date." });
    const payment = await Payment.create({ memberId: subscription.memberId, planId: term.planId, subscriptionId: subscription._id, renewalKey, amountDue: remaining, amountPaid: body.amountPaid, method: body.method, paymentDate: dateOnly(paymentDate), receiptNumber: await generateReceiptNumber(), idempotencyKey: key, requestFingerprint: fingerprint });
    return successResponse({ _id: String(payment._id), receiptNumber: payment.receiptNumber, amountPaid: payment.amountPaid, outstanding: remaining - payment.amountPaid }, 201);
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Request body must be valid JSON.", 400);
    if (error?.code === 11000) return errorResponse("This payment request was already processed.", 409);
    console.error("Subscription payment error:", error?.message); return errorResponse("Could not record subscription payment.", 500);
  }
}
