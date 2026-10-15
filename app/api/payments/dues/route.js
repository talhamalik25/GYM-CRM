import connectToDatabase from "../../../../lib/db";
import { successResponse } from "../../../../lib/planApiResponse";
import { handlePaymentError } from "../../../../lib/paymentApiHelpers";
import Payment from "../../../../models/Payment";
import { requireApiUser } from "../../../../lib/auth";
import Subscription from "../../../../models/Subscription";

export async function GET(request) {
  const authResponse = await requireApiUser(request);
  if (authResponse) return authResponse;
  try {
    await connectToDatabase();
    const dues = await Payment.aggregate([
      { $match: { subscriptionId: null, $expr: { $lt: ["$amountPaid", "$amountDue"] } } },
      { $group: { _id: "$memberId", balance: { $sum: { $subtract: ["$amountDue", "$amountPaid"] } }, paymentCount: { $sum: 1 } } },
      { $sort: { balance: -1 } },
      { $lookup: { from: "members", localField: "_id", foreignField: "_id", as: "member" } },
      { $unwind: { path: "$member", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, memberId: { $toString: "$_id" }, memberName: { $ifNull: ["$member.fullName", "Member unavailable"] }, balance: 1, paymentCount: 1 } },
    ]);
    const subscriptionDues = await Subscription.aggregate([
      { $unwind: "$renewalHistory" },
      { $group: { _id: "$_id", memberId: { $first: "$memberId" }, amountDue: { $sum: "$renewalHistory.planSnapshot.agreedPrice" } } },
      { $lookup: { from: "payments", localField: "_id", foreignField: "subscriptionId", as: "payments" } },
      { $lookup: { from: "members", localField: "memberId", foreignField: "_id", as: "member" } },
      { $unwind: { path: "$member", preserveNullAndEmptyArrays: true } },
      { $project: { memberId: 1, memberName: { $ifNull: ["$member.fullName", "Member unavailable"] }, balance: { $max: [0, { $subtract: ["$amountDue", { $sum: "$payments.amountPaid" }] }] } } },
      { $match: { balance: { $gt: 0 } } },
      { $group: { _id: "$memberId", balance: { $sum: "$balance" }, paymentCount: { $sum: 1 } } },
    ]);
    const byMember = new Map(dues.map((entry) => [entry.memberId, entry]));
    for (const entry of subscriptionDues) {
      const memberId = String(entry._id); const current = byMember.get(memberId);
      if (current) { current.balance += entry.balance; current.paymentCount += entry.paymentCount; }
      else byMember.set(memberId, { memberId, memberName: entry.memberName, balance: entry.balance, paymentCount: entry.paymentCount });
    }
    return successResponse([...byMember.values()].sort((a, b) => b.balance - a.balance));
  } catch (error) { return handlePaymentError(error); }
}
