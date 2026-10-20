import connectToDatabase from "../../../lib/db.js";
import { getRequestGymId, getRequestTenantContext, requireApiUser } from "../../../lib/auth.js";
import { errorResponse, successResponse } from "../../../lib/planApiResponse.js";
import { buildGymReport, getGymReportMonths } from "../../../lib/reportRules.js";
import { dateOnly, gymToday } from "../../../lib/subscriptionRules.js";
import Attendance from "../../../models/Attendance.js";
import Member from "../../../models/Member.js";
import Payment from "../../../models/Payment.js";
import Subscription from "../../../models/Subscription.js";

export async function GET(request) {
  const authResponse = await requireApiUser(request);
  if (authResponse) return authResponse;
  const context = getRequestTenantContext(request);
  if (!context?.gymId || !context?.gym) return errorResponse("Gym workspace could not be resolved.", 403);

  try {
    await connectToDatabase();
    const gymId = getRequestGymId(request);
    const now = new Date();
    const today = gymToday(now, context.gym.timezone);
    const monthWindows = getGymReportMonths(now, context.gym.timezone);
    const first = monthWindows[0];
    const endOfToday = dateOnly(today);
    endOfToday.setUTCDate(endOfToday.getUTCDate() + 1);
    const monthExpression = { $dateToString: { format: "%Y-%m", date: "$paymentDate" } };
    const memberMonthExpression = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
    const [payments, members, attendance, activeSubscriptions] = await Promise.all([
      Payment.aggregate([
        { $match: { gymId, paymentDate: { $gte: first.start, $lt: endOfToday } } },
        { $group: { _id: monthExpression, total: { $sum: "$amountPaid" } } },
      ]),
      Member.aggregate([
        { $match: { gymId, createdAt: { $gte: first.start, $lte: now } } },
        { $group: { _id: memberMonthExpression, count: { $sum: 1 } } },
      ]),
      Attendance.aggregate([
        { $match: { gymId, date: { $gte: `${first.month}-01`, $lte: today } } },
        { $group: { _id: { $substrBytes: ["$date", 0, 7] }, count: { $sum: 1 } } },
      ]),
      Subscription.countDocuments({ gymId, status: { $ne: "cancelled" }, startDate: { $lte: dateOnly(today) }, expiryDate: { $gte: dateOnly(today) } }),
    ]);
    return successResponse(buildGymReport({ monthWindows, payments, members, attendance, activeSubscriptions }));
  } catch {
    console.error("Gym reports could not be loaded.");
    return errorResponse("Could not load reports. Please try again.", 503);
  }
}
