import connectToDatabase from "../../../../lib/db.js";
import { requireSuperadminUser } from "../../../../lib/auth.js";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse.js";
import Gym from "../../../../models/Gym.js";
import User from "../../../../models/User.js";

export async function GET(request) {
  const authResponse = await requireSuperadminUser(request);
  if (authResponse) return authResponse;

  try {
    await connectToDatabase();
    const [gyms, activeGyms, suspendedGyms, userAccounts, activeUserAccounts, inactiveUserAccounts, platformSuperadmins] = await Promise.all([
      Gym.countDocuments({}),
      Gym.countDocuments({ status: "active" }),
      Gym.countDocuments({ status: "suspended" }),
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ role: { $in: ["superadmin", "platform_super_admin"] } }),
    ]);

    return successResponse({
      gyms: { total: gyms, active: activeGyms, suspended: suspendedGyms },
      userAccounts: { total: userAccounts, active: activeUserAccounts, inactive: inactiveUserAccounts, platformSuperadmins },
    });
  } catch {
    console.error("Admin platform overview could not be loaded.");
    return errorResponse("Could not load platform overview. Please try again.", 503);
  }
}
