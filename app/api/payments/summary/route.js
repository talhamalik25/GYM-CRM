import connectToDatabase from "../../../../lib/db";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse";
import { handlePaymentError } from "../../../../lib/paymentApiHelpers";
import Payment from "../../../../models/Payment";

export async function GET() {
  try {
    await connectToDatabase();
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const [month, dues] = await Promise.all([
      Payment.aggregate([{ $match: { paymentDate: { $gte: start, $lt: end } } }, { $group: { _id: null, collectedThisMonth: { $sum: "$amountPaid" }, paymentsThisMonth: { $sum: 1 } } }]),
      Payment.aggregate([{ $match: { $expr: { $lt: ["$amountPaid", "$amountDue"] } } }, { $group: { _id: null, pendingDues: { $sum: { $subtract: ["$amountDue", "$amountPaid"] } } } }]),
    ]);
    return successResponse({ collectedThisMonth: month[0]?.collectedThisMonth || 0, paymentsThisMonth: month[0]?.paymentsThisMonth || 0, pendingDues: dues[0]?.pendingDues || 0 });
  } catch (error) { return handlePaymentError(error); }
}
