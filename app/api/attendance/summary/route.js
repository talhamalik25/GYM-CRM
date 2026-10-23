import connectToDatabase from "../../../../lib/db.js";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse.js";
import Attendance from "../../../../models/Attendance.js";
import { requireApiUser, getRequestGymId, getRequestTenantContext } from "../../../../lib/auth.js";
import { attendanceKpiWindow, buildAttendanceKpi } from "../../../../lib/dashboardKpiRules.js";

export async function GET(request) {
  const authResponse = await requireApiUser(request);
  if (authResponse) return authResponse;
  try {
    await connectToDatabase();
    const window = attendanceKpiWindow(new Date(), getRequestTenantContext(request).gym.timezone);
    // Same bounded seven-day query, at most seven aggregate rows. Yesterday's
    // comparator stops at the same elapsed duration from its gym-local midnight.
    const rows = await Attendance.aggregate([
      { $match: { gymId: getRequestGymId(request), date: { $gte: window.weekStart, $lte: window.today }, checkInAt: { $lte: window.now } } },
      { $group: {
        _id: "$date", count: { $sum: 1 },
        inside: { $sum: { $cond: [{ $eq: ["$checkOutAt", null] }, 1, 0] } },
        elapsedCount: { $sum: { $cond: [{ $and: [
          { $gte: ["$checkInAt", window.yesterdayStart] },
          { $lte: ["$checkInAt", window.yesterdayCutoff] },
        ] }, 1, 0] } },
      } },
    ]);
    return successResponse(buildAttendanceKpi(rows, window));
  } catch (error) {
    if (error?.name === "ValidationError") return errorResponse("Attendance summary could not be calculated.", 400);
    console.error("Attendance summary could not be loaded.");
    return errorResponse("Attendance summary is temporarily unavailable.", 503);
  }
}

