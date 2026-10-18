import connectToDatabase from "../../../../lib/db";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse";
import { requireSuperadminUser } from "../../../../lib/auth";
import { serializeAdminGym } from "../../../../lib/adminGymRules.js";
import Gym from "../../../../models/Gym";
import GymMembership from "../../../../models/GymMembership";

export async function GET(request) {
  const authResponse = await requireSuperadminUser(request);
  if (authResponse) return authResponse;

  try {
    await connectToDatabase();
    const gyms = await Gym.find({}).select("name slug status timezone createdAt updatedAt").sort({ createdAt: -1, _id: 1 }).lean();
    const memberships = gyms.length ? await GymMembership.find({
      gymId: { $in: gyms.map(({ _id }) => _id) }, role: "gym_owner", status: "active",
    }).select("gymId userId").populate("userId", "fullName email").lean() : [];
    const ownersByGym = new Map();
    for (const membership of memberships) {
      const key = String(membership.gymId);
      ownersByGym.set(key, [...(ownersByGym.get(key) || []), membership]);
    }
    return successResponse({ items: gyms.map((gym) => serializeAdminGym(gym, ownersByGym.get(String(gym._id)))) });
  } catch {
    console.error("Admin gym list could not be loaded.");
    return errorResponse("Could not load gym accounts. Please try again.", 503);
  }
}
