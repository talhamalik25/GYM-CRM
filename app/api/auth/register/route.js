import Branch from "../../../../models/Branch.js";
import { readJsonBody, RequestBodyError, requestBodyErrorResponse } from "../../../../lib/requestBody.js";
import mongoose from "mongoose";
import { createSession, validateRequestOrigin } from "../../../../lib/auth.js";
import { publicRegistrationConfigured, publicTrialSubscription, registrationGymSlug, validateGymOwnerRegistrationBody } from "../../../../lib/gymOwnerRegistration.js";
import connectToDatabase from "../../../../lib/db.js";
import { hashPassword } from "../../../../lib/passwords.js";
import Gym from "../../../../models/Gym.js";
import User from "../../../../models/User.js";
import GymMembership from "../../../../models/GymMembership.js";
import SaaSPlan from "../../../../models/SaaSPlan.js";
import AuthSession from "../../../../models/AuthSession.js";
import PublicTrialClaim from "../../../../models/PublicTrialClaim.js";

function jsonError(message, status, fields) {
  return Response.json({ success: false, error: { message, ...(fields ? { fields } : {}) } }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request) {
  const originError = validateRequestOrigin(request);
  if (originError) return originError;

  let body;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    if (error instanceof RequestBodyError) return requestBodyErrorResponse(error);
    return jsonError("Enter valid registration details.", 400);
  }

  const validation = validateGymOwnerRegistrationBody(body);
  if (validation.message) return jsonError(validation.message, 400, validation.fields);
  if (!publicRegistrationConfigured()) return jsonError("Public gym registration is currently unavailable.", 503);

  let session;
  try {
    await connectToDatabase();
    // Fail closed if eligibility indexes are unavailable, including when
    // automatic index creation is disabled by the deployment.
    await Promise.all([User.init(), Gym.init(), GymMembership.init(), AuthSession.init(), PublicTrialClaim.init(), Branch.init()]);
    for (const [Model, fields] of [[User, ["email"]], [Gym, ["slug"]], [PublicTrialClaim, ["email", "gymSlug"]]]) {
      const indexes = await Model.listIndexes();
      if (fields.some((field) => !indexes.some((index) => index.unique && !index.partialFilterExpression && !index.sparse && Object.keys(index.key).length === 1 && index.key[field] === 1))) {
        throw new Error("Registration eligibility indexes are unavailable.");
      }
    }
    const slug = registrationGymSlug(validation.gymName);
    const passwordHash = await hashPassword(validation.password);
    session = await mongoose.startSession();
    let response;
    await session.withTransaction(async () => {
      const plan = await SaaSPlan.findOne({ _id: process.env.PUBLIC_TRIAL_PLAN_ID, isActive: true }).session(session).lean();
      if (!plan) throw new Error("The configured trial plan is unavailable.");
      if (await User.exists({ email: validation.email }).session(session) || await Gym.exists({ slug }).session(session)) {
        const error = new Error("Registration identity already exists.");
        error.code = 11000;
        throw error;
      }
      const now = new Date();
      const subscription = publicTrialSubscription(plan, now);
      const userId = new mongoose.Types.ObjectId();
      const gymId = new mongoose.Types.ObjectId();
      await PublicTrialClaim.create([{ email: validation.email, gymSlug: slug, userId, gymId, claimedAt: now }], { session });
      await User.create([{ _id: userId, fullName: validation.fullName, email: validation.email, passwordHash, role: "staff", isActive: true }], { session });
      await Gym.create([{
        _id: gymId, name: validation.gymName, slug, status: "active", saasAccessRequired: true,
        trialUsedAt: now, createdAt: now, saasSubscription: subscription,
        publicTrial: { version: 1, startedAt: now, endsAt: subscription.trialEndsAt },
      }], { session });
      await Branch.create([{ _id: gymId, gymId, name: "Main branch", isDefault: true }], { session });
      await GymMembership.create([{ userId, gymId, role: "gym_owner", status: "active" }], { session });
      response = await createSession(userId, { session });
    });
    return response;
  } catch (error) {
    if (error?.code === 11000) return jsonError("This account or gym identity is already registered or has used a trial. Sign in or contact Fitivo support.", 409);
    // A commit acknowledgement can be lost: do not promise rollback to clients.
    return jsonError("Registration could not be confirmed. Try signing in before retrying, or contact Fitivo support.", 503);
  } finally {
    if (session) await session.endSession();
  }
}
