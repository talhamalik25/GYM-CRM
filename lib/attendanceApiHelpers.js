import { errorResponse } from "./planApiResponse";
import { getDurationMinutes } from "./attendanceHelpers";
import { resolveGymTimezone } from "./subscriptionRules.js";

export function attendanceError(message, status, fields, code) {
  return Response.json({ success: false, error: { message, ...(code ? { code } : {}), ...(fields ? { fields } : {}) } }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function handleAttendanceError(error) {
  if (error?.code === 11000) return attendanceError("This member already has an attendance record for this gym day.", 409);
  if (error?.name === "ValidationError") {
    const fields = Object.fromEntries(Object.entries(error.errors || {}).map(([key, value]) => [key, value.message]));
    return errorResponse("Please check the attendance details and try again.", 400, fields);
  }
  console.error("Attendance API error:", error?.message || "Unknown error");
  return errorResponse("Something went wrong while accessing attendance. Please try again.", 500);
}

export function isDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function formatGymTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: resolveGymTimezone(),
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function serializeAttendance(record) {
  const member = record.memberId && typeof record.memberId === "object" ? record.memberId : null;
  const plan = member?.planId && typeof member.planId === "object" ? member.planId : null;
  return {
    _id: String(record._id),
    memberId: String(member?._id || record.memberId),
    member: member ? { id: String(member._id), fullName: member.fullName } : null,
    plan: plan ? { id: String(plan._id), name: plan.name } : null,
    date: record.date,
    checkInAt: record.checkInAt,
    checkOutAt: record.checkOutAt || null,
    overrideExpired: Boolean(record.overrideExpired),
    durationMinutes: getDurationMinutes(record.checkInAt, record.checkOutAt),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

