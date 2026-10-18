import mongoose from "mongoose";
import connectToDatabase from "../../../../lib/db";
import { attendanceError, formatGymTime, handleAttendanceError, serializeAttendance } from "../../../../lib/attendanceApiHelpers";
import { getGymDate } from "../../../../lib/gymDate";
import { getMembershipStatus } from "../../../../lib/membersService";
import Attendance from "../../../../models/Attendance";
import Member from "../../../../models/Member";
import { requireApiUser, getRequestGymId, tenantFilter } from "../../../../lib/auth";

async function populatedAttendance(request, id) {
  return Attendance.findOne(tenantFilter(request, { _id: id })).populate({ path: "memberId", match: tenantFilter(request), select: "fullName planId", populate: { path: "planId", match: tenantFilter(request), select: "name" } }).lean();
}

async function alreadyCheckedIn(request, memberId, date) {
  const existing = await Attendance.findOne(tenantFilter(request, { memberId, date })).lean();
  return attendanceError(
    existing ? `This member is already checked in today at ${formatGymTime(existing.checkInAt)}.` : "This member already has an attendance record for today.",
    409,
    { memberId: "This member is already checked in today." },
    "ALREADY_CHECKED_IN",
  );
}

export async function POST(request) {
  const authResponse = await requireApiUser(request);
  if (authResponse) return authResponse;
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return attendanceError("Request body must be a JSON object.", 400, {});
    const fields = {};
    if (typeof body.memberId !== "string" || !mongoose.isObjectIdOrHexString(body.memberId)) fields.memberId = "Choose a valid member.";
    if (body.confirmExpired !== undefined && typeof body.confirmExpired !== "boolean") fields.confirmExpired = "Confirmation must be true or false.";
    if (Object.keys(fields).length) return attendanceError("Please correct the highlighted fields.", 400, fields);

    await connectToDatabase();
    await Attendance.init();
    const member = await Member.findOne(tenantFilter(request, { _id: body.memberId })).populate({ path: "planId", match: tenantFilter(request), select: "name" }).lean();
    if (!member) return attendanceError("The selected member was not found.", 404, { memberId: "Choose an existing member." });
    const now = new Date();
    const date = getGymDate(now);
    if (await Attendance.exists(tenantFilter(request, { memberId: member._id, date }))) return alreadyCheckedIn(request, member._id, date);
    const status = getMembershipStatus(member.expiryDate?.toISOString?.().slice(0, 10) || member.expiryDate, date, member.startDate?.toISOString?.().slice(0, 10) || member.startDate);
    if (status === "Upcoming") {
      return attendanceError("This member's membership has not started yet.", 409, undefined, "MEMBERSHIP_NOT_STARTED");
    }
    if (status === "Expired" && body.confirmExpired !== true) {
      return attendanceError("This member's membership has expired. Confirm to check them in anyway.", 409, undefined, "MEMBERSHIP_EXPIRED");
    }
    try {
      const created = await Attendance.create({
        gymId: getRequestGymId(request),
        memberId: member._id,
        date,
        checkInAt: now,
        overrideExpired: status === "Expired" && body.confirmExpired === true,
      });
      return Response.json({ success: true, data: serializeAttendance(await populatedAttendance(request, created._id)) }, {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      });
    } catch (error) {
      if (error?.code === 11000) return alreadyCheckedIn(request, member._id, date);
      throw error;
    }
  } catch (error) {
    if (error instanceof SyntaxError) return attendanceError("Request body must be valid JSON.", 400);
    return handleAttendanceError(error);
  }
}

