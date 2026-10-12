import mongoose from "mongoose";
import connectToDatabase from "../../../../lib/db";
import { getMembershipExpiryDate } from "../../../../lib/membersService";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse";
import { handleMemberError, normalizeMemberPhone, serializeMember, validateMemberBody } from "../../../../lib/memberApiHelpers";
import Member from "../../../../models/Member";
import Plan from "../../../../models/Plan";

function memberDate(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

function dateString(value) {
  return new Date(value).toISOString().slice(0, 10);
}

export async function GET(_request, context) {
  try {
    const { id } = await context.params;
    if (!mongoose.isObjectIdOrHexString(id)) return errorResponse("Member id is invalid.", 400);
    await connectToDatabase();
    const member = await Member.findById(id).populate("planId", "name price").lean();
    if (!member) return errorResponse("Member was not found.", 404);
    return successResponse(serializeMember(member));
  } catch (error) {
    return handleMemberError(error);
  }
}

export async function PATCH(request, context) {
  try {
    const { id } = await context.params;
    if (!mongoose.isObjectIdOrHexString(id)) return errorResponse("Member id is invalid.", 400);
    const body = await request.json();
    // A client-supplied expiry is never applied, even when other fields are updated.
    const { expiryDate: _clientExpiryDate, ...memberBody } = body || {};
    const validation = validateMemberBody(memberBody, { partial: true });
    if (validation) return errorResponse(validation.message, 400, validation.fields);
    if (memberBody.planId && !mongoose.isObjectIdOrHexString(memberBody.planId)) {
      return errorResponse("Plan id is invalid.", 400, { planId: "Choose a valid plan." });
    }

    await connectToDatabase();
    const current = await Member.findById(id);
    if (!current) return errorResponse("Member was not found.", 404);

    const currentPlanId = String(current.planId);
    const nextPlanId = memberBody.planId || currentPlanId;
    const planChanged = nextPlanId !== currentPlanId;
    const startDateChanged = Boolean(memberBody.startDate && memberBody.startDate !== dateString(current.startDate));
    const update = { ...memberBody };

    if (memberBody.planId && planChanged || memberBody.startDate) {
      const plan = await Plan.findById(nextPlanId);
      if (!plan) return errorResponse("The selected plan was not found.", 400, { planId: "Choose an available plan." });
      if (planChanged && !plan.isActive) return errorResponse("Only active plans can be assigned to a member.", 400, { planId: "Choose an active plan." });
      if (planChanged || startDateChanged) {
        const nextStartDate = memberBody.startDate || dateString(current.startDate);
        update.expiryDate = memberDate(getMembershipExpiryDate(nextStartDate, plan.durationDays));
      }
    }

    if (memberBody.phone) update.phone = normalizeMemberPhone(memberBody.phone);
    if (typeof memberBody.email === "string") update.email = memberBody.email.trim().toLowerCase();
    if (typeof memberBody.fullName === "string") update.fullName = memberBody.fullName.trim();
    if (typeof memberBody.notes === "string") update.notes = memberBody.notes.trim();
    if (memberBody.planId) update.planId = nextPlanId;
    if (memberBody.startDate) update.startDate = memberDate(memberBody.startDate);
    if (memberBody.dateOfBirth !== undefined) update.dateOfBirth = memberBody.dateOfBirth ? memberDate(memberBody.dateOfBirth) : null;

    const updated = await Member.findByIdAndUpdate(id, update, { new: true, runValidators: true }).populate("planId", "name price").lean();
    return successResponse(serializeMember(updated));
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Request body must be valid JSON.", 400);
    return handleMemberError(error);
  }
}
