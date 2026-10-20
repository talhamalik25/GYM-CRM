import mongoose from "mongoose";
import connectToDatabase from "../../../lib/db";
import { getMembershipExpiryDate, EXPIRING_DAYS } from "../../../lib/membersService";
import { errorResponse, successResponse } from "../../../lib/planApiResponse";
import { handleMemberError, normalizeMemberPhone, serializeMember, validateMemberBody } from "../../../lib/memberApiHelpers";
import Member from "../../../models/Member";
import Plan from "../../../models/Plan";
import Trainer from "../../../models/Trainer";
import { isTrainerId, validateTrainerAssignment } from "../../../lib/trainerApiHelpers";
import { requireApiUser, getRequestGymId, tenantFilter } from "../../../lib/auth";
import { gymToday } from "../../../lib/subscriptionRules.js";
import { enforceSaaSCapacity } from "../../../lib/saasCapacity.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function memberDate(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function GET(request) {
  const authResponse = await requireApiUser(request);
  if (authResponse) return authResponse;
  try {
    const params = new URL(request.url).searchParams;
    const search = (params.get("search") || "").trim();
    const status = (params.get("status") || "all").toLowerCase();
    const planId = params.get("planId") || "";
    const page = Number(params.get("page") || 1);
    const requestedLimit = Number(params.get("limit") || 10);
    if (!Number.isInteger(page) || page < 1) return errorResponse("Page must be a positive whole number.", 400, { page: "Enter a valid page number." });
    if (!Number.isInteger(requestedLimit) || requestedLimit < 1) return errorResponse("Limit must be a positive whole number.", 400, { limit: "Enter a valid page size." });
    if (!["all", "upcoming", "active", "expiring", "expired"].includes(status)) return errorResponse("Status must be upcoming, active, expiring, expired, or all.", 400, { status: "Choose a valid member status." });
    if (planId && !mongoose.isObjectIdOrHexString(planId)) return errorResponse("Plan id is invalid.", 400, { planId: "Choose a valid plan." });

    const limit = Math.min(requestedLimit, 50);
    const filter = {};
    if (search) {
      const expression = new RegExp(escapeRegex(search), "i");
      const phoneSearch = normalizeMemberPhone(search);
      filter.$or = [{ fullName: expression }];
      if (phoneSearch) filter.$or.push({ phone: new RegExp(escapeRegex(phoneSearch), "i") });
    }
    if (planId) filter.planId = planId;

    const todayString = gymToday();
    const today = memberDate(todayString);
    const expiringThrough = new Date(today.getTime() + EXPIRING_DAYS * 86400000);
    if (status === "upcoming") filter.startDate = { $gt: today };
    if (status === "expired") filter.expiryDate = { $lt: today };
    if (status === "expiring") { filter.startDate = { $lte: today }; filter.expiryDate = { $gte: today, $lte: expiringThrough }; }
    if (status === "active") { filter.startDate = { $lte: today }; filter.expiryDate = { $gt: expiringThrough }; }

    await connectToDatabase();
    const [members, total] = await Promise.all([
      Member.find(tenantFilter(request, filter)).populate({ path: "planId", match: tenantFilter(request), select: "name price" }).populate({ path: "trainerId", match: tenantFilter(request), select: "fullName status" }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Member.countDocuments(tenantFilter(request, filter)),
    ]);
    return successResponse({ items: members.map((member) => serializeMember(member, todayString)), total, page, limit, today: todayString });
  } catch (error) {
    return handleMemberError(error);
  }
}

export async function POST(request) {
  const authResponse = await requireApiUser(request);
  if (authResponse) return authResponse;
  try {
    const body = await request.json();
    // expiryDate is deliberately ignored: the selected plan and start date are authoritative.
    const { expiryDate: _clientExpiryDate, ...memberBody } = body || {};
    const validation = validateMemberBody(memberBody);
    if (validation) return errorResponse(validation.message, 400, validation.fields);
    if (!mongoose.isObjectIdOrHexString(memberBody.planId)) return errorResponse("Plan id is invalid.", 400, { planId: "Choose a valid plan." });

    await connectToDatabase();
    const limitResponse = await enforceSaaSCapacity(request, "members", Member);
    if (limitResponse) return limitResponse;
    const plan = await Plan.findOne(tenantFilter(request, { _id: memberBody.planId }));
    if (!plan) return errorResponse("The selected plan was not found.", 400, { planId: "Choose an available plan." });
    if (!plan.isActive) return errorResponse("Only active plans can be assigned to a member.", 400, { planId: "Choose an active plan." });
    let trainer = null;
    if (memberBody.trainerId && isTrainerId(memberBody.trainerId)) trainer = await Trainer.findOne(tenantFilter(request, { _id: memberBody.trainerId }));
    const trainerError = validateTrainerAssignment(memberBody.trainerId, trainer);
    if (trainerError) return errorResponse(trainerError.message, trainerError.status, { trainerId: trainerError.message });

    const startDate = memberDate(memberBody.startDate);
    const calculatedExpiry = getMembershipExpiryDate(memberBody.startDate, plan.durationDays);
    const member = await Member.create({
      gymId: getRequestGymId(request),
      fullName: memberBody.fullName.trim(),
      phone: normalizeMemberPhone(memberBody.phone),
      email: memberBody.email?.trim().toLowerCase() || "",
      gender: memberBody.gender,
      dateOfBirth: memberBody.dateOfBirth ? memberDate(memberBody.dateOfBirth) : null,
      planId: plan._id,
      trainerId: trainer?._id || null,
      startDate,
      expiryDate: memberDate(calculatedExpiry),
      notes: memberBody.notes?.trim() || "",
    });
    await member.populate([{ path: "planId", select: "name price" }, { path: "trainerId", select: "fullName status" }]);
    return successResponse(serializeMember(member), 201);
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Request body must be valid JSON.", 400);
    return handleMemberError(error);
  }
}
