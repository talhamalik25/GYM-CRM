import mongoose from "mongoose";
import connectToDatabase from "../../../../../lib/db";
import { errorResponse, successResponse } from "../../../../../lib/planApiResponse";
import { dateOnly, gymToday, isDateOnly } from "../../../../../lib/subscriptionRules";
import { requireApiUser, getRequestGymId, tenantFilter } from "../../../../../lib/auth";
import Subscription from "../../../../../models/Subscription";
import Payment from "../../../../../models/Payment";
import { createTermPayment, paymentLedgerErrorResponse, runLedgerTransaction } from "../../../../../lib/paymentLedger";
import { isValidIdempotencyKey } from "../../../../../lib/paymentRules";

const methods = ["cash", "bank_transfer", "easypaisa", "jazzcash"];

export async function POST(request, { params }) {
  const auth = await requireApiUser(request);
  if (auth) return auth;
  const { id } = await params;
  if (!mongoose.isObjectIdOrHexString(id)) return errorResponse("Subscription id is invalid.", 400);
  let fingerprint;
  let idempotencyKey;

  try {
    const body = await request.json();
    const key = request.headers.get("Idempotency-Key");
    idempotencyKey = key;
    const fields = {};
    if (!body || typeof body !== "object" || Array.isArray(body)) return errorResponse("Request body must be a JSON object.", 400);
    if (Object.hasOwn(body, "gymId")) fields.gymId = "Tenant ownership cannot be changed.";
    if (!Number.isSafeInteger(body.amountPaid) || body.amountPaid <= 0) fields.amountPaid = "Payment must be a positive whole number of rupees.";
    if (!methods.includes(body.method)) fields.method = "Choose a valid payment method.";
    if (body.paymentDate != null && (!isDateOnly(body.paymentDate) || body.paymentDate > gymToday())) fields.paymentDate = "Choose a valid payment date no later than today.";
    if (body.renewalKey != null && (typeof body.renewalKey !== "string" || body.renewalKey.length > 128)) fields.renewalKey = "Choose a valid subscription term.";
    if (!isValidIdempotencyKey(key)) fields.idempotencyKey = "A valid request key is required.";
    if (Object.keys(fields).length) return errorResponse("Please correct the highlighted fields.", 400, fields);

    await connectToDatabase();
    await Payment.init();
    const gymId = getRequestGymId(request);
    const paymentDate = body.paymentDate || gymToday();
    const renewalKey = body.renewalKey || (await Subscription.findOne({ _id: id, gymId }).select("renewalHistory").lean())?.renewalHistory?.at(-1)?.renewalKey;
    if (!renewalKey) return errorResponse("Subscription term was not found.", 404, { renewalKey: "Choose a valid term." });
    fingerprint = JSON.stringify({ subscriptionId: id, renewalKey, amountPaid: body.amountPaid, method: body.method, paymentDate });

    const result = await runLedgerTransaction(async (session) => {
      const subscription = await Subscription.findOne({ _id: id, gymId }).session(session);
      if (!subscription) return { missing: true };
      const term = subscription.renewalHistory.find((entry) => entry.renewalKey === renewalKey);
      if (!term) return { missingTerm: true };
      return createTermPayment({
        session, subscription, term, amountPaid: body.amountPaid, method: body.method,
        paymentDate: dateOnly(paymentDate), idempotencyKey, requestFingerprint: fingerprint,
        gymId,
      });
    });
    if (result.missing) return errorResponse("Subscription was not found.", 404);
    if (result.missingTerm) return errorResponse("Subscription term was not found.", 404, { renewalKey: "Choose a valid term." });
    return successResponse({ _id: String(result.payment._id), receiptNumber: result.payment.receiptNumber, amountPaid: result.payment.amountPaid, outstanding: result.outstanding }, result.duplicate ? 200 : 201);
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Request body must be valid JSON.", 400);
    const ledgerResponse = paymentLedgerErrorResponse(error, errorResponse);
    if (ledgerResponse) return ledgerResponse;
    if (error?.code === 11000) {
      try {
        const existing = await Payment.findOne(tenantFilter(request, { idempotencyKey })).select("+requestFingerprint");
        if (existing && existing.requestFingerprint === fingerprint) return successResponse({ _id: String(existing._id), receiptNumber: existing.receiptNumber, amountPaid: existing.amountPaid }, 200);
        if (existing) return errorResponse("This payment request key was already used for different details.", 409);
      } catch { /* Keep the sanitized route error below. */ }
      return errorResponse("This payment request was already processed. Retry using the original request key.", 409);
    }
    console.error("Subscription payment error:", error?.message);
    return errorResponse("Could not record subscription payment.", 500);
  }
}
