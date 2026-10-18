import { validateRequestOrigin } from "../../../../lib/auth.js";
import { validateGymOwnerRegistrationBody } from "../../../../lib/gymOwnerRegistration.js";

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
    body = await request.json();
  } catch {
    return jsonError("Enter valid registration details.", 400);
  }

  const validation = validateGymOwnerRegistrationBody(body);
  if (validation.message) return jsonError(validation.message, 400, validation.fields);
  return jsonError("Public gym registration is paused while the existing-data migration and tenant isolation are verified.", 503);
}
