import connectToDatabase from "../../../../lib/db";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse";
import { handlePaymentError } from "../../../../lib/paymentApiHelpers";
import Payment from "../../../../models/Payment";
import { requireApiUser } from "../../../../lib/auth";
import { currentGymPaymentMonthRange } from "../../../../lib/paymentRules";

export async function GET(request) {
  const authResponse = await requireApiUser(request);
  if (authResponse) return authResponse;
  try {
    await connectToDatabase();
    const { start, end } = currentGymPaymentMonthRange();
    const [month, dues] = await Promise.all([
      Payment.aggregate([{ $match: { paymentDate: { $gte: start, $lt: end } } }, { $group: { _id: null, collectedThisMonth: { $sum: "$amountPaid" }, paymentsThisMonth: { $sum: 1 } } }]),
      Payment.aggregate([{ $match: { $expr: { $lt: ["$amountPaid", "$amountDue"] } } }, { $group: { _id: null, pendingDues: { $sum: { $subtract: ["$amountDue", "$amountPaid"] } } } }]),
    ]);
    return successResponse({ collectedThisMonth: month[0]?.collectedThisMonth || 0, paymentsThisMonth: month[0]?.paymentsThisMonth || 0, pendingDues: dues[0]?.pendingDues || 0 });
  } catch (error) { return handlePaymentError(error); }
}
