import connectToDatabase from "../../../../lib/db.js";
import { createSession, validateRequestOrigin } from "../../../../lib/auth.js";
import { verifyPassword, DUMMY_PASSWORD_HASH } from "../../../../lib/passwords.js";
import { consumeLoginAttempt } from "../../../../lib/loginSecurity.js";
import { readJsonBody, RequestBodyError, requestBodyErrorResponse } from "../../../../lib/requestBody.js";
import User from "../../../../models/User.js";

const invalidCredentials = () => Response.json({ success: false, error: { message: "The email or password is incorrect." } }, {
  status: 401,
  headers: { "Cache-Control": "no-store" },
});

export async function POST(request) {
  const originError = validateRequestOrigin(request);
  if (originError) return originError;
  let body;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    if (error instanceof RequestBodyError) return requestBodyErrorResponse(error);
    return Response.json({ success: false, error: { message: "Enter a valid email address and password." } }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body) || typeof body.email !== "string" || typeof body.password !== "string" || body.email.length > 254 || Buffer.byteLength(body.password, "utf8") > 128) {
    return Response.json({ success: false, error: { message: "Enter a valid email address and password." } }, { status: 400 });
  }
  const email = body.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return invalidCredentials();

  try {
    await connectToDatabase();
    const limit = await consumeLoginAttempt(email);
    if (!limit.allowed) return Response.json({ success: false, error: { message: "Too many sign-in attempts. Try again later." } }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(limit.retryAfter) } });
    const user = await User.findOne({ email }).select("+passwordHash +authVersion isActive").lean();
    const validPassword = await verifyPassword(body.password, user?.isActive !== false && user?.passwordHash ? user.passwordHash : DUMMY_PASSWORD_HASH);
    if (!user || user.isActive === false || !validPassword) return invalidCredentials();
    return await createSession(user._id, { expectedAuthVersion: user.authVersion ?? 0 });
  } catch {
    console.error("Authentication login failed.");
    return Response.json({ success: false, error: { message: "Sign-in is temporarily unavailable. Please try again." } }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
