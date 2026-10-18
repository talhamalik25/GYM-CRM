import connectToDatabase from "../../../../lib/db";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse";
import { handlePaymentError } from "../../../../lib/paymentApiHelpers";
import Payment from "../../../../models/Payment";
import { requireApiUser, getRequestGymId } from "../../../../lib/auth";
import { currentGymPaymentMonthRange } from "../../../../lib/paymentRules";
import Subscription from "../../../../models/Subscription";

export async function GET(request) {
  const authResponse = await requireApiUser(request);
  if (authResponse) return authResponse;
  try {
    await connectToDatabase();
    const { start, end } = currentGymPaymentMonthRange();
    const [month, dues] = await Promise.all([
      Payment.aggregate([{ $match: { gymId: getRequestGymId(request), paymentDate: { $gte: start, $lt: end } } }, { $group: { _id: null, collectedThisMonth: { $sum: "$amountPaid" }, paymentsThisMonth: { $sum: 1 } } }]),
      Payment.aggregate([{ $match: { gymId: getRequestGymId(request), subscriptionId: null, $expr: { $lt: ["$amountPaid", "$amountDue"] } } }, { $group: { _id: null, pendingDues: { $sum: { $subtract: ["$amountDue", "$amountPaid"] } } } }]),
    ]);
    const subscriptionBalances = await Subscription.aggregate([
      { $match: { gymId: getRequestGymId(request) } },
      { $unwind: "$renewalHistory" },
      { $group: { _id: "$_id", amountDue: { $sum: "$renewalHistory.planSnapshot.agreedPrice" } } },
      { $lookup: { from: "payments", let: { subscriptionId: "$_id", gymId: "$gymId" }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$subscriptionId", "$$subscriptionId"] }, { $eq: ["$gymId", "$$gymId"] }] } } }], as: "payments" } },
      { $project: { balance: { $max: [0, { $subtract: ["$amountDue", { $sum: "$payments.amountPaid" }] }] } } },
      { $group: { _id: null, pendingDues: { $sum: "$balance" } } },
    ]);
    return successResponse({ collectedThisMonth: month[0]?.collectedThisMonth || 0, paymentsThisMonth: month[0]?.paymentsThisMonth || 0, pendingDues: (dues[0]?.pendingDues || 0) + (subscriptionBalances[0]?.pendingDues || 0) });
  } catch (error) { return handlePaymentError(error); }
}
