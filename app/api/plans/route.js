import connectToDatabase from "../../../lib/db";
import Plan from "../../../models/Plan";
import Member from "../../../models/Member";
import { errorResponse, handlePlanError, successResponse, validatePlanBody } from "../../../lib/planApiResponse";
import { requireApiUser, getRequestGymId, tenantFilter } from "../../../lib/auth";

export async function GET(request) {
  const authResponse = await requireApiUser(request);
  if (authResponse) return authResponse;
  try {
    await connectToDatabase();
    const params = new URL(request.url).searchParams;
    const onlyActive = params.get("isActive") === "true";
    const plans = await Plan.find(tenantFilter(request, onlyActive ? { isActive: true } : {})).sort({ createdAt: -1 }).lean();
    if (params.get("includeMemberCounts") === "true") {
      const counts = plans.length ? await Member.aggregate([
        { $match: { gymId: getRequestGymId(request), planId: { $in: plans.map(({ _id }) => _id) } } },
        { $group: { _id: "$planId", count: { $sum: 1 } } },
      ]) : [];
      const countByPlan = new Map(counts.map(({ _id, count }) => [String(_id), count]));
      return successResponse(plans.map((plan) => ({ ...plan, memberCount: countByPlan.get(String(plan._id)) || 0 })));
    }
    return successResponse(plans);
  } catch (error) {
    return handlePlanError(error);
  }
}

export async function POST(request) {
  const authResponse = await requireApiUser(request);
  if (authResponse) return authResponse;
  try {
    const body = await request.json();
    const validation = validatePlanBody(body);
    if (validation) return errorResponse(validation.message, 400, validation.fields);

    await connectToDatabase();
    const plan = await Plan.create({
      gymId: getRequestGymId(request),
      name: body.name.trim(),
      price: body.price,
      durationDays: body.durationDays,
      description: body.description?.trim() || "",
      ...(Object.hasOwn(body, "isActive") ? { isActive: body.isActive } : {}),
    });
    return successResponse(plan.toObject(), 201);
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Request body must be valid JSON.", 400);
    return handlePlanError(error);
  }
}
