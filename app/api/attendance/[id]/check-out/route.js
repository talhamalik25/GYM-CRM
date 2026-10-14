import mongoose from "mongoose";
import connectToDatabase from "../../../../../lib/db";
import { attendanceError, handleAttendanceError, serializeAttendance } from "../../../../../lib/attendanceApiHelpers";
import { getGymDate } from "../../../../../lib/gymDate";
import Attendance from "../../../../../models/Attendance";
import { requireApiUser } from "../../../../../lib/auth";

async function populatedAttendance(id) {
  return Attendance.findById(id).populate({ path: "memberId", select: "fullName planId", populate: { path: "planId", select: "name" } }).lean();
}

export async function POST(_request, { params }) {
  const authResponse = await requireApiUser(_request);
  if (authResponse) return authResponse;
  try {
    const { id } = await params;
    if (!mongoose.isObjectIdOrHexString(id)) return attendanceError("Attendance id is invalid.", 400, { id: "Enter a valid attendance id." });
    await connectToDatabase();
    const existing = await Attendance.findById(id).lean();
    if (!existing) return attendanceError("Attendance record was not found.", 404);
    const today = getGymDate();
    // Old open records stay open; closing one on a later gym day would record a misleading duration.
    if (existing.date !== today) return attendanceError("This check-in is from an earlier gym day and cannot be checked out now.", 409, undefined, "CHECK_IN_NOT_CURRENT_DAY");
    if (existing.checkOutAt) return attendanceError("This attendance record has already been checked out.", 409, undefined, "ALREADY_CHECKED_OUT");

    const updated = await Attendance.findOneAndUpdate(
      { _id: id, date: today, checkOutAt: null },
      { $set: { checkOutAt: new Date() } },
      { new: true, runValidators: true },
    );
    if (!updated) {
      const latest = await Attendance.findById(id).lean();
      if (!latest) return attendanceError("Attendance record was not found.", 404);
      if (latest.date !== today) return attendanceError("This check-in is from an earlier gym day and cannot be checked out now.", 409, undefined, "CHECK_IN_NOT_CURRENT_DAY");
      return attendanceError("This attendance record has already been checked out.", 409, undefined, "ALREADY_CHECKED_OUT");
    }
    return Response.json({ success: true, data: serializeAttendance(await populatedAttendance(updated._id)) }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) { return handleAttendanceError(error); }
}

