import mongoose from "mongoose";
import connectToDatabase from "../../../lib/db";
import { handleAttendanceError, isDateOnly, serializeAttendance } from "../../../lib/attendanceApiHelpers";
import { getGymDate } from "../../../lib/gymDate";
import { errorResponse, successResponse } from "../../../lib/planApiResponse";
import Attendance from "../../../models/Attendance";
import Member from "../../../models/Member";
import { requireApiUser, getRequestGymId, tenantFilter } from "../../../lib/auth";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(request) {
  const authResponse = await requireApiUser(request);
  if (authResponse) return authResponse;
  try {
    const params = new URL(request.url).searchParams;
    const date = params.get("date") || "";
    const from = params.get("from") || "";
    const to = params.get("to") || "";
    const memberId = params.get("memberId") || "";
    const search = (params.get("search") || "").trim();
    const page = Number(params.get("page") || 1);
    const requestedLimit = Number(params.get("limit") || 10);
    if (!Number.isInteger(page) || page < 1) return errorResponse("Page must be a positive whole number.", 400, { page: "Enter a valid page number." });
    if (!Number.isInteger(requestedLimit) || requestedLimit < 1) return errorResponse("Limit must be a positive whole number.", 400, { limit: "Enter a valid page size." });
    if (date && (from || to)) return errorResponse("Choose one date or a date range.", 400, { date: "Use date or from/to, not both." });
    if (date && !isDateOnly(date)) return errorResponse("Date must use YYYY-MM-DD format.", 400, { date: "Enter a valid date." });
    if ((from || to) && (!from || !to || !isDateOnly(from) || !isDateOnly(to) || from > to)) {
      return errorResponse("Provide a valid date range with from no later than to.", 400, { from: "Choose a valid date range.", to: "Choose a valid date range." });
    }
    if (memberId && !mongoose.isObjectIdOrHexString(memberId)) return errorResponse("Member id is invalid.", 400, { memberId: "Choose a valid member." });

    await connectToDatabase();
    const filter = {};
    if (date) filter.date = date;
    else if (from && to) filter.date = { $gte: from, $lte: to };
    else if (!memberId) filter.date = getGymDate();
    if (memberId) filter.memberId = memberId;
    if (search) {
      const matchingMembers = await Member.find(tenantFilter(request, { fullName: new RegExp(escapeRegex(search), "i") })).distinct("_id");
      filter.memberId = { $in: memberId ? matchingMembers.filter((id) => String(id) === memberId) : matchingMembers };
    }
    const limit = Math.min(requestedLimit, 50);
    const [records, total] = await Promise.all([
      Attendance.find(tenantFilter(request, filter))
        .populate({ path: "memberId", match: tenantFilter(request), select: "fullName planId", populate: { path: "planId", match: tenantFilter(request), select: "name" } })
        .sort({ checkInAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Attendance.countDocuments(tenantFilter(request, filter)),
    ]);
    return successResponse({ items: records.map(serializeAttendance), total, page, limit });
  } catch (error) { return handleAttendanceError(error); }
}
