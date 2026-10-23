import { clearSessionCookie, revokeSession, validateRequestOrigin } from "../../../../lib/auth.js";
import { NextResponse } from "next/server.js";

export async function POST(request) {
  const originError = validateRequestOrigin(request);
  if (originError) return originError;
  try {
    await revokeSession(request);
  } catch {
    console.error("Authentication logout failed.");
    return NextResponse.json({ success: false, error: { message: "Could not end this session. Please try again." } }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
  return clearSessionCookie(NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } }));
}
