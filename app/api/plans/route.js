import connectToDatabase from "../../../lib/db";
import Plan from "../../../models/Plan";
import { errorResponse, handlePlanError, successResponse, validatePlanBody } from "../../../lib/planApiResponse";
import { requireApiUser, getRequestGymId, tenantFilter } from "../../../lib/auth";

export async function GET(request) {
  const authResponse = await requireApiUser(request);
  if (authResponse) return authResponse;
  try {
    await connectToDatabase();
    const onlyActive = new URL(request.url).searchParams.get("isActive") === "true";
    const plans = await Plan.find(tenantFilter(request, onlyActive ? { isActive: true } : {})).sort({ createdAt: -1 }).lean();
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
