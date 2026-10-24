import mongoose from "mongoose";
import connectToDatabase from "../../../../lib/db";
import Plan from "../../../../models/Plan";
import { errorResponse, handlePlanError, successResponse, validatePlanBody } from "../../../../lib/planApiResponse";
import { requireApiUser, tenantFilter } from "../../../../lib/auth";

async function readId(context) {
  const { id } = await context.params;
  return id;
}

export async function GET(_request, context) {
  const authResponse = await requireApiUser(_request);
  if (authResponse) return authResponse;
  try {
    const id = await readId(context);
    if (!mongoose.isObjectIdOrHexString(id)) return errorResponse("Plan id is invalid.", 400);
    await connectToDatabase();
    const plan = await Plan.findOne(tenantFilter(_request, { _id: id })).lean();
    if (!plan) return errorResponse("Plan was not found.", 404);
    return successResponse(plan);
  } catch (error) {
    return handlePlanError(error);
  }
}

export async function PATCH(request, context) {
  const authResponse = await requireApiUser(request);
  if (authResponse) return authResponse;
  try {
    const id = await readId(context);
    if (!mongoose.isObjectIdOrHexString(id)) return errorResponse("Plan id is invalid.", 400);
    const body = await request.json();
    const validation = validatePlanBody(body, { partial: true });
    if (validation) return errorResponse(validation.message, 400, validation.fields);

    await connectToDatabase();
    const update = { ...body };
    delete update.gymId;
    delete update.branchId;
    if (typeof update.name === "string") update.name = update.name.trim();
    if (typeof update.description === "string") update.description = update.description.trim();
    const plan = await Plan.findOneAndUpdate(tenantFilter(request, { _id: id }), update, { new: true, runValidators: true }).lean();
    if (!plan) return errorResponse("Plan was not found.", 404);
    return successResponse(plan);
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Request body must be valid JSON.", 400);
    return handlePlanError(error);
  }
}
