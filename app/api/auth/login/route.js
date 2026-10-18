import connectToDatabase from "../../../../lib/db.js";
import { createSession, validateRequestOrigin } from "../../../../lib/auth.js";
import { verifyPassword } from "../../../../lib/passwords.js";
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
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: { message: "Enter a valid email address and password." } }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body) || typeof body.email !== "string" || typeof body.password !== "string" || body.email.length > 254 || Buffer.byteLength(body.password, "utf8") > 128) {
    return Response.json({ success: false, error: { message: "Enter a valid email address and password." } }, { status: 400 });
  }
  const email = body.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return invalidCredentials();

  try {
    await connectToDatabase();
    const user = await User.findOne({ email }).select("+passwordHash isActive").lean();
    if (!user || !user.isActive || !(await verifyPassword(body.password, user.passwordHash))) return invalidCredentials();
    return await createSession(user._id);
  } catch {
    console.error("Authentication login failed.");
    return Response.json({ success: false, error: { message: "Sign-in is temporarily unavailable. Please try again." } }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
