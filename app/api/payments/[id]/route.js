import mongoose from "mongoose";
import connectToDatabase from "../../../../lib/db";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse";
import { handlePaymentError, serializePayment } from "../../../../lib/paymentApiHelpers";
import Payment from "../../../../models/Payment";
import { requireApiUser } from "../../../../lib/auth";

export async function GET(_request, { params }) {
  const authResponse = await requireApiUser(_request);
  if (authResponse) return authResponse;
  try {
    const { id } = await params;
    if (!mongoose.isObjectIdOrHexString(id)) return errorResponse("Payment id is invalid.", 400, { id: "Enter a valid payment id." });
    await connectToDatabase();
    const payment = await Payment.findById(id).populate("memberId", "fullName").populate("planId", "name").lean();
    if (!payment) return errorResponse("Payment was not found.", 404);
    return successResponse(serializePayment(payment));
  } catch (error) { return handlePaymentError(error); }
}
