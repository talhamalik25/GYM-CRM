import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server.js";
import connectToDatabase from "../../../../lib/db.js";
import Gym from "../../../../models/Gym.js";
import { expiredSaaSPaidPeriodFilter, expiredSaaSTrialFilter } from "../../../../lib/platformBillingRules.js";

function authorized(request) {
  const secret = process.env.SAAS_EXPIRY_CRON_SECRET || "";
  const authorization = request.headers.get("authorization") || "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (Buffer.byteLength(secret, "utf8") < 32 || !supplied) return false;
  return timingSafeEqual(createHash("sha256").update(supplied).digest(), createHash("sha256").update(secret).digest());
}

export async function POST(request) {
  if (!process.env.SAAS_EXPIRY_CRON_SECRET || Buffer.byteLength(process.env.SAAS_EXPIRY_CRON_SECRET, "utf8") < 32) {
    return NextResponse.json({ success: false, error: { message: "SaaS expiry processing is not configured." } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  if (!authorized(request)) {
    return NextResponse.json({ success: false, error: { message: "Authentication is required." } }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  try {
    await connectToDatabase();
    const now = new Date();
    const [trials, paidPeriods] = await Promise.all([
      Gym.updateMany(expiredSaaSTrialFilter(now), { $set: { "saasSubscription.status": "expired" } }),
      Gym.updateMany(expiredSaaSPaidPeriodFilter(now), { $set: { "saasSubscription.status": "expired" } }),
    ]);
    return NextResponse.json({ success: true, data: { processed: trials.modifiedCount + paidPeriods.modifiedCount } }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("SaaS subscription expiry processing failed.");
    return NextResponse.json({ success: false, error: { message: "SaaS expiry processing is temporarily unavailable." } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
