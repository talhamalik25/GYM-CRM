import connectToDatabase from "../../../lib/db.js";
import { getRequestGymId, getRequestTenantContext, requireApiUser } from "../../../lib/auth.js";
import { errorResponse, successResponse } from "../../../lib/planApiResponse.js";
import { addDays, dateOnly } from "../../../lib/subscriptionRules.js";
import { buildGymReportAnalytics, gymDateStartUtc, resolveGymReportRange } from "../../../lib/reportRules.js";
import Attendance from "../../../models/Attendance.js";
import Member from "../../../models/Member.js";
import Payment from "../../../models/Payment.js";
import Subscription from "../../../models/Subscription.js";
import { buildSignupKpi } from "../../../lib/dashboardKpiRules.js";

export async function GET(request) {
  const authResponse = await requireApiUser(request);
  if (authResponse) return authResponse;
  const context = getRequestTenantContext(request);
  if (!context?.gymId || !context?.gym) return errorResponse("Gym workspace could not be resolved.", 403);

  const params = new URL(request.url).searchParams;
  const includeDashboard = params.get("dashboard") === "1";
  if (includeDashboard && params.has("range") && params.get("range") !== "6m") {
    return errorResponse("Dashboard analytics require the six-month report window.", 400);
  }
  const resolvedRange = resolveGymReportRange({
    range: params.get("range") || "6m",
    startDate: params.get("startDate") || "",
    endDate: params.get("endDate") || "",
    granularity: params.get("granularity") || "",
  }, new Date(), context.gym.timezone);
  if (resolvedRange.error) return errorResponse(resolvedRange.error, 400);

  try {
    await connectToDatabase();
    const gymId = getRequestGymId(request);
    const period = resolvedRange.data;
    const today = period.today;
    const previousStart = dateOnly(period.previousStartDate);
    const paymentsEnd = dateOnly(addDays(period.endDate, 1));
    const memberStart = gymDateStartUtc(period.previousStartDate, period.timezone);
    const memberEnd = gymDateStartUtc(addDays(period.endDate, 1), period.timezone);
    const dashboardSignupStart = includeDashboard ? gymDateStartUtc(addDays(today, -14), period.timezone) : null;
    const dashboardTodayStart = includeDashboard ? gymDateStartUtc(today, period.timezone) : null;
    const dateRange = { $gte: period.previousStartDate, $lte: period.endDate };
    const todayDate = dateOnly(today);
    const expiringThrough = dateOnly(addDays(today, 7));
    const [payments, memberAnalytics, attendance, renewals, activeSubscriptions, totalSubscriptions] = await Promise.all([
      Payment.aggregate([
        { $match: { gymId, paymentDate: { $gte: previousStart, $lt: paymentsEnd } } },
        { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$paymentDate", timezone: "UTC" } },
          total: { $sum: "$amountPaid" },
        } },
      ]),
      Member.aggregate([
        { $match: { gymId } },
        { $facet: {
          growth: [
            { $match: { createdAt: { $gte: memberStart, $lt: memberEnd } } },
            { $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: period.timezone } },
              count: { $sum: 1 },
            } },
          ],
          ...(includeDashboard ? { dashboardSignups: [
            { $match: { isActive: { $ne: false }, createdAt: { $gte: dashboardSignupStart, $lt: dashboardTodayStart } } },
            { $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: period.timezone } },
              count: { $sum: 1 },
            } },
          ] } : {}),
          membershipStatuses: [
            { $group: { _id: { $switch: { branches: [
              { case: { $eq: ["$membershipCancelled", true] }, then: "cancelled" },
              { case: { $gt: ["$startDate", todayDate] }, then: "upcoming" },
              { case: { $lt: ["$expiryDate", todayDate] }, then: "expired" },
              { case: { $lte: ["$expiryDate", expiringThrough] }, then: "expiring" },
            ], default: "active" } }, count: { $sum: 1 } } },
          ],
          total: [{ $count: "count" }],
        } },
      ]),
      Attendance.aggregate([
        { $match: { gymId, date: dateRange } },
        { $group: { _id: "$date", count: { $sum: 1 } } },
      ]),
      Subscription.aggregate([
        { $match: { gymId, "renewalHistory.createdAt": { $gte: memberStart, $lt: memberEnd } } },
        { $unwind: "$renewalHistory" },
        { $match: { $expr: { $ne: ["$renewalHistory.renewalKey", "$createKey"] } } },
        { $match: { "renewalHistory.createdAt": { $gte: memberStart, $lt: memberEnd } } },
        { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$renewalHistory.createdAt", timezone: period.timezone } },
          count: { $sum: 1 },
        } },
      ]),
      Subscription.countDocuments({ gymId, status: { $ne: "cancelled" }, startDate: { $lte: todayDate }, expiryDate: { $gte: todayDate } }),
      includeDashboard ? Subscription.countDocuments({ gymId }) : Promise.resolve(null),
    ]);
    const members = memberAnalytics[0] || { growth: [], membershipStatuses: [], total: [] };
    const report = buildGymReportAnalytics({
      period,
      payments,
      members: members.growth,
      attendance,
      renewals,
      totalMembers: members.total[0]?.count || 0,
      activeSubscriptions,
      membershipStatuses: members.membershipStatuses,
    });
    if (includeDashboard) report.dashboardKpis = { signups: buildSignupKpi(members.dashboardSignups || [], today), totalSubscriptions };
    return successResponse(report);
  } catch {
    console.error("Gym reports could not be loaded.");
    return errorResponse("Could not load reports. Please try again.", 503);
  }
}
