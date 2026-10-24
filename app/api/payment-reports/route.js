import { requireApiUser, getRequestScope, getRequestTenantContext } from "../../../lib/auth.js";
import { resolveGymReportRange, gymDateStartUtc } from "../../../lib/reportRules.js";
import { addDays } from "../../../lib/subscriptionRules.js";
import { successResponse, errorResponse } from "../../../lib/planApiResponse.js";
import Payment from "../../../models/Payment.js";
export async function GET(request) {
  const denied = await requireApiUser(request);
  if (denied) return denied;
  try {
    const params = new URL(request.url).searchParams;
    const range = resolveGymReportRange({ range: params.get("range") || "30d", startDate: params.get("startDate") || "", endDate: params.get("endDate") || "" }, new Date(), getRequestTenantContext(request).gym.timezone);
    if (range.error) return errorResponse(range.error, 400);
    const period = range.data;
    const methods = await Payment.aggregate([
      { $match: { ...getRequestScope(request), paymentDate: { $gte: gymDateStartUtc(period.startDate, period.timezone), $lt: gymDateStartUtc(addDays(period.endDate, 1), period.timezone) } } },
      { $group: { _id: "$method", collected: { $sum: "$amountPaid" }, transactions: { $sum: 1 }, averagePayment: { $avg: "$amountPaid" } } },
      { $sort: { collected: -1 } },
    ]);
    return successResponse({ period, methods });
  } catch { return errorResponse("Could not load payment analysis.", 503); }
}
