import connectToDatabase from "../../../../lib/db.js";
import { validateRequestOrigin } from "../../../../lib/auth.js";
import { readJsonBody, RequestBodyError, requestBodyErrorResponse } from "../../../../lib/requestBody.js";
import { consumePublicAttempt, rateLimitResponse } from "../../../../lib/loginSecurity.js";
import { validateMarketingLead } from "../../../../lib/marketingLead.js";
import MarketingLead from "../../../../models/MarketingLead.js";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
export async function POST(request) {
  const originError = validateRequestOrigin(request);
  if (originError) return originError;
  try {
    const body = await readJsonBody(request, 4096);
    const { data, errors } = validateMarketingLead(body);
    if (Object.keys(errors).length) return Response.json({ success: false, error: { message: "Check your details.", fields: errors } }, { status: 400, headers });
    await connectToDatabase();
    const limit = await consumePublicAttempt("marketingLead", data.phone);
    if (!limit.allowed) return rateLimitResponse(limit);
    await MarketingLead.create({ ...data, consentAt: new Date(), source: "marketing-chatbot" });
    return Response.json({ success: true }, { status: 201, headers });
  } catch (error) {
    if (error instanceof RequestBodyError) return requestBodyErrorResponse(error);
    return Response.json({ success: false, error: { message: "We couldn’t save your request. Please try again or contact the team directly." } }, { status: 503, headers });
  }
}
