import connectToDatabase from "../../../../lib/db";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse";
import { handleTrainerError, isTrainerId, serializeTrainer, validateTrainerBody } from "../../../../lib/trainerApiHelpers";
import { requireApiUser, tenantFilter } from "../../../../lib/auth";
import Trainer from "../../../../models/Trainer";
import Member from "../../../../models/Member";

export async function GET(request, { params }) {
  const auth = await requireApiUser(request); if (auth) return auth;
  const { id } = await params;
  if (!isTrainerId(id)) return errorResponse("Trainer id is invalid.", 400);
  try {
    await connectToDatabase();
    const [trainer, assignedMembers] = await Promise.all([
      Trainer.findOne(tenantFilter(request, { _id: id })).lean(),
      Member.find(tenantFilter(request, { trainerId: id })).select("fullName email phone").sort({ fullName: 1 }).lean(),
    ]);
    if (!trainer) return errorResponse("Trainer was not found.", 404);
    return successResponse({ ...serializeTrainer(trainer, assignedMembers.length), assignedMembers: assignedMembers.map(member => ({ id: String(member._id), fullName: member.fullName, email: member.email || "", phone: member.phone })) });
  } catch (error) { return handleTrainerError(error); }
}

export async function PATCH(request, { params }) {
  const auth = await requireApiUser(request); if (auth) return auth;
  const { id } = await params;
  if (!isTrainerId(id)) return errorResponse("Trainer id is invalid.", 400);
  try {
    const body = await request.json(); const validation = validateTrainerBody(body, { partial: true });
    if (validation) return errorResponse(validation.message, 400, validation.fields);
    await connectToDatabase();
    const update = { ...body };
    delete update.gymId;
    if (typeof update.fullName === "string") update.fullName = update.fullName.trim();
    if (typeof update.email === "string") update.email = update.email.trim().toLowerCase();
    if (typeof update.phone === "string") update.phone = `${update.phone.trim().startsWith("+") ? "+" : ""}${update.phone.replace(/\D/g, "")}`;
    if (typeof update.specialization === "string") update.specialization = update.specialization.trim();
    if (typeof update.joiningDate === "string") update.joiningDate = new Date(`${update.joiningDate}T00:00:00.000Z`);
    if (typeof update.profileImage === "string") update.profileImage = update.profileImage.trim();
    if (typeof update.notes === "string") update.notes = update.notes.trim();
    const trainer = await Trainer.findOneAndUpdate(tenantFilter(request, { _id: id }), update, { new: true, runValidators: true }).lean();
    if (!trainer) return errorResponse("Trainer was not found.", 404);
    const assignedMemberCount = await Member.countDocuments(tenantFilter(request, { trainerId: id }));
    return successResponse(serializeTrainer(trainer, assignedMemberCount));
  } catch (error) { if (error instanceof SyntaxError) return errorResponse("Request body must be valid JSON.", 400); return handleTrainerError(error); }
}
