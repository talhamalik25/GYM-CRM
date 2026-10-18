import connectToDatabase from "../../../../lib/db";
import { successResponse } from "../../../../lib/planApiResponse";
import { handlePaymentError } from "../../../../lib/paymentApiHelpers";
import Payment from "../../../../models/Payment";
import Subscription from "../../../../models/Subscription";
import Member from "../../../../models/Member";
import { requireApiUser, getRequestGymId, tenantFilter } from "../../../../lib/auth";

export async function GET(request) {
  const authResponse = await requireApiUser(request);
  if (authResponse) return authResponse;
  try {
    await connectToDatabase();
    const [legacyDues, subscriptions] = await Promise.all([
      Payment.aggregate([
        { $match: { gymId: getRequestGymId(request), subscriptionId: null, $expr: { $lt: ["$amountPaid", "$amountDue"] } } },
        { $lookup: { from: "members", let: { memberId: "$memberId", gymId: "$gymId" }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$_id", "$$memberId"] }, { $eq: ["$gymId", "$$gymId"] }] } } }], as: "member" } },
        { $unwind: { path: "$member", preserveNullAndEmptyArrays: true } },
        { $group: { _id: "$memberId", memberName: { $first: "$member.fullName" }, balance: { $sum: { $subtract: ["$amountDue", "$amountPaid"] } }, paymentCount: { $sum: 1 } } },
        { $project: { _id: 0, memberId: { $toString: "$_id" }, memberName: { $ifNull: ["$memberName", "Member unavailable"] }, balance: 1, paymentCount: 1 } },
      ]),
      Subscription.find(tenantFilter(request)).select("memberId renewalHistory").lean(),
    ]);

    const byMember = new Map(legacyDues.map((entry) => [entry.memberId, {
      memberId: entry.memberId, memberName: entry.memberName, balance: entry.balance,
      paymentCount: entry.paymentCount, charges: [], unallocatedLegacyBalance: entry.balance,
    }]));
    const subscriptionIds = subscriptions.map((item) => item._id);
    const payments = subscriptionIds.length
      ? await Payment.find(tenantFilter(request, { subscriptionId: { $in: subscriptionIds } })).select("subscriptionId renewalKey amountPaid").lean()
      : [];
    const paidByTerm = new Map();
    for (const payment of payments) {
      const key = `${payment.subscriptionId}:${payment.renewalKey}`;
      paidByTerm.set(key, (paidByTerm.get(key) || 0) + payment.amountPaid);
    }
    const memberIds = [...new Set(subscriptions.map((item) => String(item.memberId)))];
    const members = await Member.find(tenantFilter(request, { _id: { $in: memberIds } })).select("fullName").lean();
    const memberNames = new Map(members.map((member) => [String(member._id), member.fullName]));
    for (const subscription of subscriptions) {
      const memberId = String(subscription.memberId);
      const item = byMember.get(memberId) || {
        memberId, memberName: memberNames.get(memberId) || "Member unavailable", balance: 0,
        paymentCount: 0, charges: [], unallocatedLegacyBalance: 0,
      };
      for (const term of subscription.renewalHistory || []) {
        const amountDue = Number(term.planSnapshot?.agreedPrice || 0);
        const amountPaid = paidByTerm.get(`${subscription._id}:${term.renewalKey}`) || 0;
        const balance = Math.max(0, amountDue - amountPaid);
        if (balance <= 0) continue;
        item.balance += balance;
        item.paymentCount += 1;
        item.charges.push({
          subscriptionId: String(subscription._id), renewalKey: term.renewalKey,
          planName: term.planSnapshot.name, amountDue, amountPaid, balance,
        });
      }
      byMember.set(memberId, item);
    }
    return successResponse([...byMember.values()].sort((a, b) => b.balance - a.balance));
  } catch (error) {
    return handlePaymentError(error);
  }
}
