import connectToDatabase from "../../../../lib/db";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse";
import { handleAttendanceError } from "../../../../lib/attendanceApiHelpers";
import { getGymDate } from "../../../../lib/gymDate";
import Attendance from "../../../../models/Attendance";
import { requireApiUser } from "../../../../lib/auth";

export async function GET(request) {
  const authResponse = await requireApiUser(request);
  if (authResponse) return authResponse;
  try {
    await connectToDatabase();
    const today = getGymDate();
    // “This week” means the last 7 gym calendar days, including today; divide by 7 for average check-ins per gym day.
    const weekStart = getGymDate(new Date(), 6);
    const [result] = await Attendance.aggregate([
      { $match: { date: { $gte: weekStart, $lte: today } } },
      { $group: {
        _id: null,
        checkedInToday: { $sum: { $cond: [{ $eq: ["$date", today] }, 1, 0] } },
        currentlyInside: { $sum: { $cond: [{ $and: [{ $eq: ["$date", today] }, { $eq: ["$checkOutAt", null] }] }, 1, 0] } },
        checkInsThisWeek: { $sum: 1 },
      } },
    ]);
    return successResponse({
      date: today,
      timeZone: process.env.GYM_TIMEZONE || "Asia/Karachi",
      checkedInToday: result?.checkedInToday || 0,
      currentlyInside: result?.currentlyInside || 0,
      averageCheckInsThisWeek: Math.round(((result?.checkInsThisWeek || 0) / 7) * 10) / 10,
    });
  } catch (error) {
    if (error?.name === "ValidationError") return errorResponse("Attendance summary could not be calculated.", 400);
    return handleAttendanceError(error);
  }
}

