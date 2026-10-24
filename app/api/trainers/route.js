import { withCapacityTransaction } from "../../../lib/entitlements.js";
import connectToDatabase from "../../../lib/db";
import { errorResponse, successResponse } from "../../../lib/planApiResponse";
import { handleTrainerError, serializeTrainer, validateTrainerBody } from "../../../lib/trainerApiHelpers";
import { requireApiUser, getRequestGymId, tenantFilter, getRequestScope, getRequestBranchId } from "../../../lib/auth";
import Trainer from "../../../models/Trainer";
import Member from "../../../models/Member";

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(request) {
  const auth = await requireApiUser(request); if (auth) return auth;
  try {
    const params = new URL(request.url).searchParams;
    const search = (params.get("search") || "").trim(); const status = (params.get("status") || "all").toLowerCase();
    const specialization = (params.get("specialization") || "").trim();
    const page = Number(params.get("page") || 1); const requestedLimit = Number(params.get("limit") || 10);
    if (!Number.isInteger(page) || page < 1) return errorResponse("Page must be a positive whole number.", 400, { page: "Enter a valid page." });
    if (!Number.isInteger(requestedLimit) || requestedLimit < 1) return errorResponse("Limit must be a positive whole number.", 400, { limit: "Enter a valid page size." });
    if (!(["all", "active", "inactive"].includes(status))) return errorResponse("Status must be active, inactive, or all.", 400, { status: "Choose a valid status." });
    await connectToDatabase();
    const filter = {};
    if (status !== "all") filter.status = status;
    if (specialization) filter.specialization = new RegExp(`^${escapeRegex(specialization)}$`, "i");
    if (search) { const expression = new RegExp(escapeRegex(search), "i"); filter.$or = [{ fullName: expression }, { email: expression }, { phone: expression }, { specialization: expression }]; }
    const limit = Math.min(requestedLimit, 50); const skip = (page - 1) * limit;
    const [trainers, total, specializations] = await Promise.all([Trainer.find(tenantFilter(request, filter)).sort({ fullName: 1, _id: 1 }).skip(skip).limit(limit).lean(), Trainer.countDocuments(tenantFilter(request, filter)), Trainer.distinct("specialization", tenantFilter(request))]);
    const counts = trainers.length ? await Member.aggregate([{ $match: { ...getRequestScope(request), trainerId: { $in: trainers.map(item => item._id) } } }, { $group: { _id: "$trainerId", count: { $sum: 1 } } }]) : [];
    const countByTrainer = new Map(counts.map(item => [String(item._id), item.count]));
    return successResponse({ items: trainers.map(item => serializeTrainer(item, countByTrainer.get(String(item._id)) || 0)), specializations: specializations.sort((a, b) => a.localeCompare(b)), total, page, limit });
  } catch (error) { return handleTrainerError(error); }
}

async function handlePOST(request) {
  const auth = await requireApiUser(request); if (auth) return auth;
  try {
    const body = await request.json(); const validation = validateTrainerBody(body);
    if (validation) return errorResponse(validation.message, 400, validation.fields);
    await connectToDatabase();
    await Trainer.init();
    const trainer = await Trainer.create({ gymId: getRequestGymId(request), branchId: getRequestBranchId(request), fullName: body.fullName.trim(), email: body.email.trim().toLowerCase(), phone: normalizePhone(body.phone), specialization: body.specialization.trim(), joiningDate: new Date(`${body.joiningDate}T00:00:00.000Z`), status: body.status || "active", profileImage: body.profileImage?.trim() || "", notes: body.notes?.trim() || "" });
    return successResponse(serializeTrainer(trainer), 201);
  } catch (error) { if (error instanceof SyntaxError) return errorResponse("Request body must be valid JSON.", 400); return handleTrainerError(error); }
}

function normalizePhone(value) { return `${value.trim().startsWith("+") ? "+" : ""}${value.replace(/\D/g, "")}`; }

export const POST = withCapacityTransaction(handlePOST, "trainers");
