import mongoose from "mongoose";
import { randomBytes } from "node:crypto";
import connectToDatabase from "../../../../lib/db";
import { createSession, validateRequestOrigin } from "../../../../lib/auth";
import { hashPassword } from "../../../../lib/passwords";
import { validateGymOwnerRegistrationBody } from "../../../../lib/gymOwnerRegistration";
import User from "../../../../models/User";
import Gym from "../../../../models/Gym";
import GymMembership from "../../../../models/GymMembership";

function jsonError(message, status, fields) {
  return Response.json({ success: false, error: { message, ...(fields ? { fields } : {}) } }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function emailConflict() {
  return jsonError("An account with this email already exists.", 409, { email: "This email is already in use." });
}

function duplicateEmailError(error) {
  return error?.code === 11000 && (
    error?.keyPattern?.email === 1 ||
    Object.hasOwn(error?.keyValue || {}, "email") ||
    error?.writeErrors?.some((entry) => entry?.err?.keyPattern?.email === 1 || Object.hasOwn(entry?.err?.keyValue || {}, "email"))
  );
}

function makeGymSlug(gymName) {
  const base = gymName.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 68).replace(/-+$/g, "") || "gym";
  return `${base}-${randomBytes(5).toString("hex")}`;
}

export async function POST(request) {
  const originError = validateRequestOrigin(request);
  if (originError) return originError;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Enter valid registration details.", 400);
  }

  const validation = validateGymOwnerRegistrationBody(body);
  if (validation.message) return jsonError(validation.message, 400, validation.fields);

  try {
    await connectToDatabase();
    // Follow the existing account-creation convention and ensure email uniqueness
    // is enforced by MongoDB before the transaction starts.
    await User.init();
    if (await User.exists({ email: validation.email })) return emailConflict();

    const passwordHash = await hashPassword(validation.password);
    const mongoSession = await mongoose.startSession();
    let response;
    try {
      await mongoSession.withTransaction(async () => {
        const [user] = await User.create([{
          fullName: validation.fullName,
          email: validation.email,
          passwordHash,
          role: "staff",
          isActive: true,
        }], { session: mongoSession });
        const [gym] = await Gym.create([{
          name: validation.gymName,
          slug: makeGymSlug(validation.gymName),
          status: "active",
        }], { session: mongoSession });
        await GymMembership.create([{
          userId: user._id,
          gymId: gym._id,
          role: "gym_owner",
          status: "active",
        }], { session: mongoSession });
        response = await createSession(user._id, { session: mongoSession });
      });
    } finally {
      await mongoSession.endSession();
    }
    return response || jsonError("Registration could not be completed. Please try again.", 503);
  } catch (error) {
    if (duplicateEmailError(error)) return emailConflict();
    console.error("Gym owner registration failed.");
    return jsonError("Registration is temporarily unavailable. Please try again.", 503);
  }
}
