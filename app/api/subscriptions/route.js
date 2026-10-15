import mongoose from "mongoose";
import connectToDatabase from "../../../lib/db";
import { errorResponse, successResponse } from "../../../lib/planApiResponse";
import { addDays, dateOnly, deriveSubscriptionStatus, gymToday, isDateOnly } from "../../../lib/subscriptionRules";
import { requireApiUser } from "../../../lib/auth";
import Member from "../../../models/Member";
import Plan from "../../../models/Plan";
import Payment from "../../../models/Payment";
import Subscription from "../../../models/Subscription";
import generateReceiptNumber from "../../../lib/generateReceiptNumber";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const methods = ["cash", "bank_transfer", "easypaisa", "jazzcash"];

async function serialize(subscription) {
  const s = subscription.toObject ? subscription.toObject() : subscription;
  const [member, plan, payments] = await Promise.all([
    Member.findById(s.memberId).select("fullName phone email").lean(),
    Plan.findById(s.planId).select("name").lean(),
    Payment.find({ subscriptionId: s._id }).select("amountPaid amountDue paymentDate receiptNumber method").sort({ paymentDate: 1 }).lean(),
  ]);
  const amountDue = s.renewalHistory.reduce((sum, term) => sum + term.planSnapshot.agreedPrice, 0);
  const amountPaid = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);
  return { ...s, _id: String(s._id), memberId: String(s.memberId), planId: String(s.planId), member, plan, status: deriveSubscriptionStatus(s), amountDue, amountPaid, balance: Math.max(0, amountDue - amountPaid), paymentStatus: amountPaid >= amountDue ? "paid" : amountPaid ? "partial" : "pending", payments };
}

export async function GET(request) {
  const auth = await requireApiUser(request); if (auth) return auth;
  try {
    const params = new URL(request.url).searchParams;
    const page = Number(params.get("page") || 1); const requestedLimit = Number(params.get("limit") || 10);
    const search = (params.get("search") || "").trim(); const status = (params.get("status") || "all").toLowerCase();
    if (!Number.isInteger(page) || page < 1) return errorResponse("Page must be a positive whole number.", 400, { page: "Enter a valid page." });
    if (!Number.isInteger(requestedLimit) || requestedLimit < 1) return errorResponse("Limit must be a positive whole number.", 400, { limit: "Enter a valid limit." });
    if (!["all", "pending", "active", "expired", "cancelled"].includes(status)) return errorResponse("Choose a valid status.", 400, { status: "Choose a valid status." });
    await connectToDatabase();
    let filter = {};
    if (search) { const ids = await Member.find({ $or: [{ fullName: new RegExp(escapeRegex(search), "i") }, { phone: new RegExp(escapeRegex(search), "i") }] }).distinct("_id"); filter.memberId = { $in: ids }; }
    if (status === "cancelled") filter.status = "cancelled";
    if (status !== "all" && status !== "cancelled") {
      const today = dateOnly(gymToday());
      if (status === "pending") filter.startDate = { $gt: today };
      if (status === "active") { filter.startDate = { $lte: today }; filter.expiryDate = { $gte: today }; filter.status = { $ne: "cancelled" }; }
      if (status === "expired") { filter.expiryDate = { $lt: today }; filter.status = { $ne: "cancelled" }; }
    }
    const limit = Math.min(requestedLimit, 50);
    const [items, total] = await Promise.all([Subscription.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Subscription.countDocuments(filter)]);
    return successResponse({ items: await Promise.all(items.map(serialize)), total, page, limit });
  } catch (error) { console.error("Subscriptions API error:", error?.message); return errorResponse("Could not load subscriptions.", 500); }
}

export async function POST(request) {
  const auth = await requireApiUser(request); if (auth) return auth;
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return errorResponse("Request body must be a JSON object.", 400);
    const fields = {};
    for (const field of Object.keys(body)) if (!["memberId", "planId", "startDate", "agreedPrice", "amountPaid", "method", "paymentDate"].includes(field)) fields[field] = "This field cannot be changed.";
    if (!mongoose.isObjectIdOrHexString(body.memberId)) fields.memberId = "Choose a valid member.";
    if (!mongoose.isObjectIdOrHexString(body.planId)) fields.planId = "Choose a valid plan.";
    if (!isDateOnly(body.startDate)) fields.startDate = "Enter a valid start date.";
    if (body.agreedPrice != null && (!Number.isSafeInteger(body.agreedPrice) || body.agreedPrice < 1)) fields.agreedPrice = "Price must be a positive whole number of rupees.";
    if (body.amountPaid != null && (!Number.isSafeInteger(body.amountPaid) || body.amountPaid < 0)) fields.amountPaid = "Payment must be a whole number of rupees.";
    if (body.method != null && !methods.includes(body.method)) fields.method = "Choose a valid payment method.";
    if (body.paymentDate != null && (!isDateOnly(body.paymentDate) || body.paymentDate > gymToday())) fields.paymentDate = "Choose a valid payment date no later than today.";
    const key = request.headers.get("Idempotency-Key");
    if (!key || !/^[A-Za-z0-9._:-]{16,128}$/.test(key)) fields.idempotencyKey = "A valid request key is required.";
    if (Object.keys(fields).length) return errorResponse("Please correct the highlighted fields.", 400, fields);
    await connectToDatabase(); await Subscription.init();
    const fingerprint = JSON.stringify({ memberId: body.memberId.toLowerCase(), planId: body.planId.toLowerCase(), startDate: body.startDate, agreedPrice: body.agreedPrice ?? null, amountPaid: body.amountPaid ?? 0, method: body.method || "", paymentDate: body.paymentDate || "" });
    const prior = await Subscription.findOne({ createKey: key });
    if (prior) return prior.createFingerprint === fingerprint ? successResponse(await serialize(prior), 200) : errorResponse("This request key was already used for different subscription details.", 409);
    const [member, plan] = await Promise.all([Member.findById(body.memberId), Plan.findById(body.planId)]);
    if (!member) return errorResponse("The selected member was not found.", 404, { memberId: "Choose an existing member." });
    if (!plan || !plan.isActive) return errorResponse("Choose an available active plan.", 404, { planId: "Choose an active plan." });
    const agreedPrice = body.agreedPrice ?? plan.price;
    const amountPaid = body.amountPaid ?? 0;
    if (amountPaid > agreedPrice) return errorResponse("Amount paid cannot exceed the agreed price.", 400, { amountPaid: "Enter an amount at or below the agreed price." });
    if (amountPaid > 0 && !body.method) return errorResponse("Choose a payment method.", 400, { method: "A payment method is required when recording a payment." });
    const startDate = body.startDate;
    const expiryDate = addDays(startDate, plan.durationDays - 1);
    const subscription = await Subscription.create({ memberId: member._id, planId: plan._id, startDate: dateOnly(startDate), expiryDate: dateOnly(expiryDate), originalPrice: plan.price, agreedPrice, planSnapshot: { name: plan.name, durationDays: plan.durationDays, originalPrice: plan.price, agreedPrice }, status: "pending", createKey: key, createFingerprint: fingerprint, renewalHistory: [{ renewalKey: key, requestFingerprint: fingerprint, planId: plan._id, planSnapshot: { name: plan.name, durationDays: plan.durationDays, originalPrice: plan.price, agreedPrice }, startDate: dateOnly(startDate), expiryDate: dateOnly(expiryDate) }] });
    if (amountPaid > 0) {
      const payment = await Payment.create({ memberId: member._id, planId: plan._id, subscriptionId: subscription._id, renewalKey: key, amountDue: agreedPrice, amountPaid, method: body.method, paymentDate: dateOnly(body.paymentDate || gymToday()), receiptNumber: await generateReceiptNumber(), idempotencyKey: key, requestFingerprint: `subscription:${subscription._id}:${amountPaid}:${body.method}` });
      subscription.renewalHistory[0].paymentId = payment._id; await subscription.save();
    }
    return successResponse(await serialize(subscription), 201);
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Request body must be valid JSON.", 400);
    if (error?.code === 11000) return errorResponse("This subscription request was already processed.", 409);
    console.error("Subscriptions API error:", error?.message); return errorResponse("Could not create subscription.", 500);
  }
}
