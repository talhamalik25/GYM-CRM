import connectToDatabase from "../../../../lib/db.js";
import { getRequestGymId, getRequestTenantContext, requireApiUser, tenantFilter } from "../../../../lib/auth.js";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse.js";
import { gymToday, deriveMembershipStatus } from "../../../../lib/subscriptionRules.js";
import Attendance from "../../../../models/Attendance.js";
import Member from "../../../../models/Member.js";
import Plan from "../../../../models/Plan.js";
import Trainer from "../../../../models/Trainer.js";

export async function GET(request) {
  const authResponse = await requireApiUser(request, { allowedRoles: ["trainer"] });
  if (authResponse) return authResponse;
  try {
    await connectToDatabase();
    const context = getRequestTenantContext(request);
    const trainer = await Trainer.findOne({ gymId: getRequestGymId(request), email: context.user.email, status: "active" }).select("_id fullName specialization").lean();
    if (!trainer) return errorResponse("An active trainer profile is required for this workspace.", 403);
    const today = gymToday(new Date(), context.gym.timezone);
    const members = await Member.find(tenantFilter(request, { trainerId: trainer._id, isActive: { $ne: false } }))
      .populate({ path: "planId", model: Plan, match: tenantFilter(request), select: "name" })
      .select("fullName phone planId startDate expiryDate membershipCancelled")
      .sort({ fullName: 1, _id: 1 }).limit(500).lean();
    const memberIds = members.map(({ _id }) => _id);
    const attendance = memberIds.length ? await Attendance.find(tenantFilter(request, { memberId: { $in: memberIds } }))
      .sort({ date: -1, checkInAt: -1, _id: -1 }).limit(100).populate({ path: "memberId", match: tenantFilter(request), select: "fullName" }).lean() : [];
    return successResponse({
      trainer: { name: trainer.fullName, specialization: trainer.specialization },
      today,
      members: members.map((member) => ({
        id: String(member._id), name: member.fullName, phone: member.phone,
        plan: member.planId?.name || "Plan unavailable", status: member.membershipCancelled ? "Cancelled" : deriveMembershipStatus(member.expiryDate?.toISOString?.().slice(0, 10) || member.expiryDate, today, 7, member.startDate?.toISOString?.().slice(0, 10) || member.startDate),
        expiryDate: member.expiryDate,
      })),
      attendance: attendance.map((record) => ({
        id: String(record._id), memberId: String(record.memberId?._id || record.memberId),
        memberName: record.memberId?.fullName || "Member unavailable", date: record.date,
        checkInAt: record.checkInAt, checkOutAt: record.checkOutAt || null,
      })),
    });
  } catch {
    return errorResponse("Could not load the trainer workspace. Please try again.", 503);
  }
}
