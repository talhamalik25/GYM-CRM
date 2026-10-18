import mongoose from "mongoose";
import connectToDatabase from "../../../../../lib/db";
import { errorResponse, successResponse } from "../../../../../lib/planApiResponse";
import { requireApiUser, tenantFilter } from "../../../../../lib/auth";
import Member from "../../../../../models/Member";
import Subscription from "../../../../../models/Subscription";
import Payment from "../../../../../models/Payment";
import Plan from "../../../../../models/Plan";
import { deriveSubscriptionStatus } from "../../../../../lib/subscriptionRules";

export async function GET(request, { params }) {
  const auth = await requireApiUser(request); if (auth) return auth;
  const { id } = await params;
  if (!mongoose.isObjectIdOrHexString(id)) return errorResponse("Member id is invalid.", 400);
  try {
    await connectToDatabase();
    const member = await Member.findOne(tenantFilter(request, { _id: id })).select("fullName phone email").lean();
    if (!member) return errorResponse("Member was not found.", 404);
    const subscriptions = await Subscription.find(tenantFilter(request, { memberId: id })).sort({ createdAt: -1 }).lean();
    const items = await Promise.all(subscriptions.map(async (item) => {
      const [plan, payments] = await Promise.all([Plan.findOne(tenantFilter(request, { _id: item.planId })).select("name").lean(), Payment.find(tenantFilter(request, { subscriptionId: item._id })).sort({ paymentDate: 1 }).lean()]);
      const due = item.renewalHistory.reduce((total, term) => total + term.planSnapshot.agreedPrice, 0); const paid = payments.reduce((total, payment) => total + payment.amountPaid, 0);
      return { ...item, _id: String(item._id), status: deriveSubscriptionStatus(item), plan, payments, amountDue: due, amountPaid: paid, balance: Math.max(0, due - paid), paymentStatus: paid >= due ? "paid" : paid ? "partial" : "pending" };
    }));
    return successResponse({ member, items });
  } catch (error) { console.error("Member subscriptions API error:", error?.message); return errorResponse("Could not load member subscription history.", 500); }
}
