import { getRequestTenantContext, tenantFilter } from "./auth.js";
import Member from "../models/Member.js";
import Trainer from "../models/Trainer.js";

export async function attendanceMemberFilter(request, memberId) {
  const context = getRequestTenantContext(request);
  const filter = { _id: memberId };
  if (context.role === "trainer") {
    const trainer = await Trainer.findOne(tenantFilter(request, { email: context.user.email, status: "active" })).select("_id").lean();
    // No active profile must never broaden the query to all members.
    filter.trainerId = trainer?._id || { $in: [] };
  }
  return tenantFilter(request, filter);
}

export async function canMarkAttendance(request, memberId) {
  return Boolean(await Member.exists(await attendanceMemberFilter(request, memberId)));
}
