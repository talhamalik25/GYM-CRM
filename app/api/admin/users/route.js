import connectToDatabase from "../../../../lib/db";
import { hashPassword } from "../../../../lib/passwords";
import { serializeAdminUser, validateCreateUserBody } from "../../../../lib/adminUserRules.js";
import { errorResponse, successResponse } from "../../../../lib/planApiResponse";
import { requireSuperadminUser } from "../../../../lib/auth";
import User from "../../../../models/User";

export async function GET(request) {
  const authResponse = await requireSuperadminUser(request);
  if (authResponse) return authResponse;
  try {
    await connectToDatabase();
    const users = await User.find({}).select("fullName email role isActive createdAt").sort({ createdAt: 1, _id: 1 }).lean();
    return successResponse({ items: users.map(serializeAdminUser) });
  } catch {
    console.error("Admin user list could not be loaded.");
    return errorResponse("Could not load user accounts. Please try again.", 503);
  }
}

export async function POST(request) {
  const authResponse = await requireSuperadminUser(request);
  if (authResponse) return authResponse;
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }
  const validation = validateCreateUserBody(body);
  if (validation.message) return errorResponse(validation.message, 400, validation.fields);

  try {
    await connectToDatabase();
    await User.init();
    const user = await User.create({
      email: validation.email,
      passwordHash: await hashPassword(validation.password),
      role: "staff",
      isActive: true,
    });
    return successResponse(serializeAdminUser(user), 201);
  } catch (error) {
    if (error?.code === 11000) return errorResponse("A user with this email already exists.", 409, { email: "This email is already in use." });
    console.error("Admin user creation failed.");
    return errorResponse("Could not create the user account. Please try again.", 503);
  }
}
