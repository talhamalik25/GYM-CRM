import mongoose from "mongoose";
import connectToDatabase from "../../../../lib/db";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse";
import { handlePaymentError, serializePayment } from "../../../../lib/paymentApiHelpers";
import Payment from "../../../../models/Payment";
import { requireApiUser, requireRole, getRequestActorId, getRequestScope, tenantFilter } from "../../../../lib/auth";
import { readJsonBody, RequestBodyError, requestBodyErrorResponse } from "../../../../lib/requestBody.js";
import { paymentLedgerErrorResponse, runLedgerTransaction, voidMemberPayment } from "../../../../lib/paymentLedger.js";

export async function GET(_request, { params }) {
  const authResponse = await requireApiUser(_request);
  if (authResponse) return authResponse;
  try {
    const { id } = await params;
    if (!mongoose.isObjectIdOrHexString(id)) return errorResponse("Payment id is invalid.", 400, { id: "Enter a valid payment id." });
    await connectToDatabase();
    const payment = await Payment.findOne(tenantFilter(_request, { _id: id })).populate({ path: "memberId", match: tenantFilter(_request), select: "fullName" }).populate({ path: "planId", match: tenantFilter(_request), select: "name" }).lean();
    if (!payment) return errorResponse("Payment was not found.", 404);
    return successResponse(serializePayment(payment));
  } catch (error) { return handlePaymentError(error); }
}

export async function PATCH(request, { params }) {
  const denied = await requireRole(request, "gym_owner");
  if (denied) return denied;
  const { id } = await params;
  if (!mongoose.isObjectIdOrHexString(id)) return errorResponse("Payment id is invalid.", 400);
  try {
    const body = await readJsonBody(request);
    if (body.action !== "void" || Object.keys(body).some((key) => !["action", "reason"].includes(key)) || typeof body.reason !== "string" || !body.reason.trim() || body.reason.length > 1000) {
      return errorResponse("Provide action 'void' and a reason of 1 to 1,000 characters.", 400);
    }
    const payment = await runLedgerTransaction((session) => voidMemberPayment({
      id, scope: getRequestScope(request), actorId: getRequestActorId(request), reason: body.reason.trim(),
    }, session));
    return successResponse(serializePayment(payment));
  } catch (error) {
    if (error instanceof RequestBodyError) return requestBodyErrorResponse(error);
    return paymentLedgerErrorResponse(error, errorResponse) || handlePaymentError(error);
  }
}
