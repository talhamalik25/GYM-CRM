import mongoose from "mongoose";
import connectToDatabase from "../../../lib/db";
import { errorResponse, successResponse } from "../../../lib/planApiResponse";
import { handlePaymentError, isDateOnly, paymentStatusMatch, serializePayment } from "../../../lib/paymentApiHelpers";
import Member from "../../../models/Member";
import Payment from "../../../models/Payment";
import { requireApiUser, getRequestGymId, tenantFilter, getRequestScope, getRequestBranchId } from "../../../lib/auth";
import { isValidIdempotencyKey, makePaymentFingerprint, paymentMonthRange } from "../../../lib/paymentRules";
import { gymToday } from "../../../lib/subscriptionRules.js";
import { paymentLedgerErrorResponse, recordMemberPayment, runLedgerTransaction } from "../../../lib/paymentLedger";

const methods = ["cash", "bank_transfer", "easypaisa", "jazzcash"];
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function POST(request) {
  const authResponse = await requireApiUser(request);
  if (authResponse) return authResponse;
  let idempotencyKey;
  let fingerprint;
  try {
    idempotencyKey = request.headers.get("Idempotency-Key");
    if (!isValidIdempotencyKey(idempotencyKey)) {
      return errorResponse("A valid idempotency key is required.", 400, { idempotencyKey: "Retry using the same request key." });
    }
    const body = await request.json();
    const fields = {};
    if (!body || typeof body !== "object" || Array.isArray(body)) return errorResponse("Request body must be a JSON object.", 400, {});
    if (Object.hasOwn(body, "gymId")) fields.gymId = "Tenant ownership cannot be changed.";
    if (typeof body.memberId !== "string" || !mongoose.isObjectIdOrHexString(body.memberId)) fields.memberId = "Choose a valid member.";
    if (typeof body.amountPaid !== "number" || !Number.isSafeInteger(body.amountPaid) || body.amountPaid <= 0) fields.amountPaid = "Amount paid must be a positive whole number of rupees.";
    if (!methods.includes(body.method)) fields.method = "Choose a valid payment method.";
    if (!isDateOnly(body.paymentDate ?? body.date)) fields.paymentDate = "Choose a valid payment date.";
    else if ((body.paymentDate ?? body.date) > gymToday()) fields.paymentDate = "Payment date cannot be in the future.";
    if (body.notes != null && typeof body.notes !== "string") fields.notes = "Notes must be text.";
    if (typeof body.notes === "string" && body.notes.length > 1000) fields.notes = "Notes must be 1,000 characters or fewer.";
    if (body.subscriptionId != null && (typeof body.subscriptionId !== "string" || !mongoose.isObjectIdOrHexString(body.subscriptionId))) fields.subscriptionId = "Choose a valid invoice.";
    if (body.renewalKey != null && (typeof body.renewalKey !== "string" || body.renewalKey.length < 1 || body.renewalKey.length > 128)) fields.renewalKey = "Choose a valid invoice term.";
    if (Object.keys(fields).length) return errorResponse("Please correct the highlighted fields.", 400, fields);

    const paymentDate = body.paymentDate ?? body.date;
    const notes = body.notes?.trim() || "";
    const paymentDateAt = new Date(`${paymentDate}T00:00:00.000Z`);
    fingerprint = makePaymentFingerprint({ memberId: body.memberId, amountPaid: body.amountPaid, method: body.method, paymentDate: paymentDateAt, notes, subscriptionId: body.subscriptionId || "", renewalKey: body.renewalKey || "" });
    await connectToDatabase();
    await Payment.init();
    const result = await runLedgerTransaction((session) => recordMemberPayment(session, {
      gymId: getRequestGymId(request), branchId: getRequestBranchId(request), scope: getRequestScope(request),
      memberId: body.memberId, subscriptionId: body.subscriptionId || "", renewalKey: body.renewalKey || "",
      amountPaid: body.amountPaid, method: body.method, paymentDate: paymentDateAt,
      paymentDateLabel: paymentDate, idempotencyKey, notes,
    }));
    const payment = result.payment;
    await payment.populate([{ path: "memberId", match: { ...getRequestScope(request) }, select: "fullName" }, { path: "planId", match: { ...getRequestScope(request) }, select: "name" }]);
    return successResponse(serializePayment(payment), result.duplicate ? 200 : 201);
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Request body must be valid JSON.", 400);
    if (error?.code === 11000 && (error?.keyPattern?.idempotencyKey || error?.keyValue?.idempotencyKey)) {
      try {
        const existing = await Payment.findOne(tenantFilter(request, { idempotencyKey })).select("+requestFingerprint");
        if (existing && existing.requestFingerprint === fingerprint) {
          await existing.populate([{ path: "memberId", match: { ...getRequestScope(request) }, select: "fullName" }, { path: "planId", match: { ...getRequestScope(request) }, select: "name" }]);
          return successResponse(serializePayment(existing), 200);
        }
        if (existing) return errorResponse("This payment request key was already used for different details.", 409);
      } catch { /* Preserve the normal sanitized payment error response. */ }
    }
    const ledgerResponse = paymentLedgerErrorResponse(error, errorResponse);
    if (ledgerResponse) return ledgerResponse;
    return handlePaymentError(error);
  }
}

export async function GET(request) {
  const authResponse = await requireApiUser(request);
  if (authResponse) return authResponse;
  try {
    const params = new URL(request.url).searchParams;
    const status = (params.get("status") || "all").toLowerCase();
    const method = (params.get("method") || "").toLowerCase();
    const month = params.get("month") || "";
    const memberId = params.get("memberId") || "";
    const search = (params.get("search") || "").trim();
    const page = Number(params.get("page") || 1);
    const requestedLimit = Number(params.get("limit") || 10);
    if (!Number.isInteger(page) || page < 1) return errorResponse("Page must be a positive whole number.", 400, { page: "Enter a valid page number." });
    if (!Number.isInteger(requestedLimit) || requestedLimit < 1) return errorResponse("Limit must be a positive whole number.", 400, { limit: "Enter a valid page size." });
    if (!["all", "paid", "partial", "pending"].includes(status)) return errorResponse("Choose a valid payment status.", 400, { status: "Choose a valid payment status." });
    if (method && !methods.includes(method)) return errorResponse("Choose a valid payment method.", 400, { method: "Choose a valid payment method." });
    if (month && !paymentMonthRange(month)) return errorResponse("Month must use YYYY-MM format.", 400, { month: "Enter a valid month." });
    if (memberId && !mongoose.isObjectIdOrHexString(memberId)) return errorResponse("Member id is invalid.", 400, { memberId: "Choose a valid member." });
    await connectToDatabase();
    const filter = { ...paymentStatusMatch(status) };
    if (memberId) filter.memberId = memberId;
    if (method) filter.method = method;
    if (month) {
      filter.paymentDate = paymentMonthRange(month);
    }
    if (search) {
      const members = await Member.find(tenantFilter(request, { fullName: new RegExp(escapeRegex(search), "i") })).distinct("_id");
      filter.memberId = { $in: memberId ? members.filter((id) => String(id) === memberId) : members };
    }
    const limit = Math.min(requestedLimit, 50);
    const [records, total] = await Promise.all([
      Payment.find(tenantFilter(request, filter)).populate({ path: "memberId", match: tenantFilter(request), select: "fullName" }).populate({ path: "planId", match: tenantFilter(request), select: "name" }).sort({ paymentDate: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Payment.countDocuments(tenantFilter(request, filter)),
    ]);
    return successResponse({ items: records.map(serializePayment), total, page, limit });
  } catch (error) { return handlePaymentError(error); }
}
