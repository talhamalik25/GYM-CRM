import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server.js";
import connectToDatabase from "../../../../lib/db.js";
import Gym from "../../../../models/Gym.js";
import { expiredSaaSPaidPeriodFilter, expiredSaaSTrialFilter } from "../../../../lib/platformBillingRules.js";

function authorized(request, secret) {
  const authorization = request.headers.get("authorization") || "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (Buffer.byteLength(secret, "utf8") < 32 || !supplied) return false;
  return timingSafeEqual(createHash("sha256").update(supplied).digest(), createHash("sha256").update(secret).digest());
}

export async function POST(request) {
  return processExpiry(request, process.env.SAAS_EXPIRY_CRON_SECRET || "", false);
}

// Vercel Cron sends GET and uses CRON_SECRET. This new schedule must never
// mutate existing/admin-provisioned gyms; the original POST keeps its policy.
export async function GET(request) {
  return processExpiry(request, process.env.CRON_SECRET || "", true);
}

async function processExpiry(request, secret, publicOnly) {
  if (Buffer.byteLength(secret, "utf8") < 32) {
    return NextResponse.json({ success: false, error: { message: "SaaS expiry processing is not configured." } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  if (!authorized(request, secret)) {
    return NextResponse.json({ success: false, error: { message: "Authentication is required." } }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  try {
    await connectToDatabase();
    const now = new Date();
    const scope = publicOnly ? { "publicTrial.version": 1 } : {};
    const [trials, paidPeriods] = await Promise.all([
      Gym.updateMany({ ...scope, ...expiredSaaSTrialFilter(now) }, { $set: { "saasSubscription.status": "expired" } }),
      Gym.updateMany({ ...scope, ...expiredSaaSPaidPeriodFilter(now) }, { $set: { "saasSubscription.status": "expired" } }),
    ]);
    return NextResponse.json({ success: true, data: { processed: trials.modifiedCount + paidPeriods.modifiedCount } }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("SaaS subscription expiry processing failed.");
    return NextResponse.json({ success: false, error: { message: "SaaS expiry processing is temporarily unavailable." } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
