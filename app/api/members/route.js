import mongoose from "mongoose";
import connectToDatabase from "../../../lib/db";
import { getMembershipExpiryDate, EXPIRING_DAYS } from "../../../lib/membersService";
import { errorResponse, successResponse } from "../../../lib/planApiResponse";
import { handleMemberError, normalizeMemberPhone, serializeMember, validateMemberBody } from "../../../lib/memberApiHelpers";
import Member from "../../../models/Member";
import Plan from "../../../models/Plan";
import Trainer from "../../../models/Trainer";
import { requireApiUser } from "../../../lib/auth";

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
    if (!["all", "active", "expiring", "expired"].includes(status)) return errorResponse("Status must be active, expiring, expired, or all.", 400, { status: "Choose a valid member status." });
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

    const todayString = new Date().toISOString().slice(0, 10);
    const today = memberDate(todayString);
    const expiringThrough = new Date(today.getTime() + EXPIRING_DAYS * 86400000);
    if (status === "expired") filter.expiryDate = { $lt: today };
    if (status === "expiring") filter.expiryDate = { $gte: today, $lte: expiringThrough };
    if (status === "active") filter.expiryDate = { $gt: expiringThrough };

    await connectToDatabase();
    const [members, total] = await Promise.all([
      Member.find(filter).populate("planId", "name price").populate("trainerId", "fullName status").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Member.countDocuments(filter),
    ]);
    return successResponse({ items: members.map(serializeMember), total, page, limit });
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
    if (memberBody.trainerId && !mongoose.isObjectIdOrHexString(memberBody.trainerId)) return errorResponse("Trainer id is invalid.", 400, { trainerId: "Choose a valid trainer." });

    await connectToDatabase();
    const plan = await Plan.findById(memberBody.planId);
    if (!plan) return errorResponse("The selected plan was not found.", 400, { planId: "Choose an available plan." });
    if (!plan.isActive) return errorResponse("Only active plans can be assigned to a member.", 400, { planId: "Choose an active plan." });
    let trainer = null;
    if (memberBody.trainerId) {
      trainer = await Trainer.findById(memberBody.trainerId);
      if (!trainer) return errorResponse("The selected trainer was not found.", 404, { trainerId: "Choose an existing trainer." });
      if (trainer.status !== "active") return errorResponse("Only active trainers can be assigned to a member.", 400, { trainerId: "Choose an active trainer." });
    }

    const startDate = memberDate(memberBody.startDate);
    const calculatedExpiry = getMembershipExpiryDate(memberBody.startDate, plan.durationDays);
    const member = await Member.create({
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
