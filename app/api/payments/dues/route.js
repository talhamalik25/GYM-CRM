import connectToDatabase from "../../../../lib/db";
import { successResponse } from "../../../../lib/planApiResponse";
import { handlePaymentError } from "../../../../lib/paymentApiHelpers";
import Payment from "../../../../models/Payment";
import { requireApiUser } from "../../../../lib/auth";

export async function GET(request) {
  const authResponse = await requireApiUser(request);
  if (authResponse) return authResponse;
  try {
    await connectToDatabase();
    const dues = await Payment.aggregate([
      { $match: { $expr: { $lt: ["$amountPaid", "$amountDue"] } } },
      { $group: { _id: "$memberId", balance: { $sum: { $subtract: ["$amountDue", "$amountPaid"] } }, paymentCount: { $sum: 1 } } },
      { $sort: { balance: -1 } },
      { $lookup: { from: "members", localField: "_id", foreignField: "_id", as: "member" } },
      { $unwind: { path: "$member", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, memberId: { $toString: "$_id" }, memberName: { $ifNull: ["$member.fullName", "Member unavailable"] }, balance: 1, paymentCount: 1 } },
    ]);
    return successResponse(dues);
  } catch (error) { return handlePaymentError(error); }
}
