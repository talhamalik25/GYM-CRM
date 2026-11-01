import connectToDatabase from "../../../../lib/db";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse";
import { handlePaymentError } from "../../../../lib/paymentApiHelpers";
import Payment from "../../../../models/Payment";
import Member from "../../../../models/Member";
import { requireApiUser, tenantFilter, getRequestScope } from "../../../../lib/auth";
import { currentGymPaymentMonthRange } from "../../../../lib/paymentRules";
import Subscription from "../../../../models/Subscription";
import mongoose from "mongoose";

export async function GET(request) {
  const authResponse = await requireApiUser(request);
  if (authResponse) return authResponse;
  try {
    const params = new URL(request.url).searchParams;
    const memberId = params.get("memberId") || "";
    if (memberId && !mongoose.isObjectIdOrHexString(memberId)) return errorResponse("Member id is invalid.", 400);
    await connectToDatabase();
    if (memberId) {
      const member = await Member.findOne(tenantFilter(request, { _id: memberId })).select("_id").lean();
      if (!member) return errorResponse("Member was not found.", 404);
      const [payments, subscriptions] = await Promise.all([
        Payment.find(tenantFilter(request, { memberId, voided: { $ne: true } })).select("subscriptionId renewalKey amountDue amountPaid").lean(),
        Subscription.find(tenantFilter(request, { memberId })).select("renewalHistory").lean(),
      ]);
      const paidByTerm = new Map();
      for (const payment of payments) {
        if (!payment.subscriptionId) continue;
        const key = `${payment.subscriptionId}:${payment.renewalKey}`;
        paidByTerm.set(key, (paidByTerm.get(key) || 0) + Number(payment.amountPaid || 0));
      }
      const legacyDues = payments.filter((payment) => !payment.subscriptionId)
        .reduce((total, payment) => total + Math.max(0, Number(payment.amountDue || 0) - Number(payment.amountPaid || 0)), 0);
      const subscriptionDues = subscriptions.reduce((total, subscription) => total + (subscription.renewalHistory || []).reduce((termTotal, term) => {
        const key = `${subscription._id}:${term.renewalKey}`;
        return termTotal + Math.max(0, Number(term.planSnapshot?.agreedPrice || 0) - (paidByTerm.get(key) || 0));
      }, 0), 0);
      return successResponse({
        totalPaid: payments.reduce((total, payment) => total + Number(payment.amountPaid || 0), 0),
        currentDues: legacyDues + subscriptionDues,
      });
    }
    const { start, end } = currentGymPaymentMonthRange();
    const [month, dues] = await Promise.all([
      Payment.aggregate([{ $match: { ...getRequestScope(request), voided: { $ne: true }, paymentDate: { $gte: start, $lt: end } } }, { $group: { _id: null, collectedThisMonth: { $sum: "$amountPaid" }, paymentsThisMonth: { $sum: 1 } } }]),
      Payment.aggregate([{ $match: { ...getRequestScope(request), subscriptionId: null, voided: { $ne: true }, $expr: { $lt: ["$amountPaid", "$amountDue"] } } }, { $group: { _id: null, pendingDues: { $sum: { $subtract: ["$amountDue", "$amountPaid"] } } } }]),
    ]);
    const subscriptionBalances = await Subscription.aggregate([
      { $match: { ...getRequestScope(request) } },
      { $unwind: "$renewalHistory" },
      { $group: { _id: "$_id", gymId: { $first: "$gymId" }, amountDue: { $sum: "$renewalHistory.planSnapshot.agreedPrice" } } },
      { $lookup: { from: "payments", let: { subscriptionId: "$_id", gymId: "$gymId" }, pipeline: [{ $match: { voided: { $ne: true }, $expr: { $and: [{ $eq: ["$subscriptionId", "$$subscriptionId"] }, { $eq: ["$gymId", "$$gymId"] }] } } }], as: "payments" } },
      { $project: { balance: { $max: [0, { $subtract: ["$amountDue", { $sum: "$payments.amountPaid" }] }] } } },
      { $group: { _id: null, pendingDues: { $sum: "$balance" } } },
    ]);
    return successResponse({ collectedThisMonth: month[0]?.collectedThisMonth || 0, paymentsThisMonth: month[0]?.paymentsThisMonth || 0, pendingDues: (dues[0]?.pendingDues || 0) + (subscriptionBalances[0]?.pendingDues || 0) });
  } catch (error) { return handlePaymentError(error); }
}
