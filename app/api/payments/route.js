import mongoose from "mongoose";
import connectToDatabase from "../../../lib/db";
import generateReceiptNumber from "../../../lib/generateReceiptNumber";
import { errorResponse, successResponse } from "../../../lib/planApiResponse";
import { handlePaymentError, isDateOnly, paymentStatusMatch, serializePayment } from "../../../lib/paymentApiHelpers";
import Member from "../../../models/Member";
import Payment from "../../../models/Payment";
import Plan from "../../../models/Plan";

const methods = ["cash", "bank_transfer", "easypaisa", "jazzcash"];
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function POST(request) {
  try {
    const body = await request.json();
    const fields = {};
    if (!body || typeof body !== "object" || Array.isArray(body)) return errorResponse("Request body must be a JSON object.", 400, {});
    if (typeof body.memberId !== "string" || !mongoose.isObjectIdOrHexString(body.memberId)) fields.memberId = "Choose a valid member.";
    if (typeof body.amountPaid !== "number" || !Number.isSafeInteger(body.amountPaid) || body.amountPaid < 0) fields.amountPaid = "Amount paid must be a whole number of rupees greater than or equal to zero.";
    if (!methods.includes(body.method)) fields.method = "Choose a valid payment method.";
    if (!isDateOnly(body.paymentDate ?? body.date)) fields.paymentDate = "Choose a valid payment date.";
    else if (new Date(`${body.paymentDate ?? body.date}T00:00:00.000Z`) > new Date()) fields.paymentDate = "Payment date cannot be in the future.";
    if (body.notes != null && typeof body.notes !== "string") fields.notes = "Notes must be text.";
    if (Object.keys(fields).length) return errorResponse("Please correct the highlighted fields.", 400, fields);

    await connectToDatabase();
    const member = await Member.findById(body.memberId).select("planId").lean();
    if (!member) return errorResponse("The selected member was not found.", 404, { memberId: "Choose an existing member." });
    const plan = await Plan.findById(member.planId).select("price").lean();
    if (!plan) return errorResponse("The member's plan was not found.", 404, { memberId: "This member has no available plan." });
    if (!Number.isSafeInteger(plan.price) || plan.price <= 0) return errorResponse("The member's plan price is not a valid whole rupee amount.", 400, { amountPaid: "Contact an administrator to correct the plan price." });
    if (body.amountPaid > plan.price) return errorResponse("Please correct the highlighted fields.", 400, { amountPaid: "Amount paid cannot be greater than the amount due." });
    const receiptNumber = await generateReceiptNumber();
    const payment = await Payment.create({
      memberId: member._id, planId: member.planId, amountDue: plan.price, amountPaid: body.amountPaid,
      method: body.method, paymentDate: new Date(`${body.paymentDate ?? body.date}T00:00:00.000Z`), receiptNumber,
      notes: body.notes?.trim() || "",
    });
    await payment.populate([{ path: "memberId", select: "fullName" }, { path: "planId", select: "name" }]);
    return successResponse(serializePayment(payment), 201);
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("Request body must be valid JSON.", 400);
    return handlePaymentError(error);
  }
}

export async function GET(request) {
  try {
    const params = new URL(request.url).searchParams;
    const status = (params.get("status") || "all").toLowerCase();
    const method = (params.get("method") || "").toLowerCase();
    const month = params.get("month") || "";
    const memberId = params.get("memberId") || "";
    const search = (params.get("search") || "").trim();
    const page = Number(params.get("page") || 1);
    const requestedLimit = Number(params.get("limit") || 10);
    if (!Number.isInteger(page) || page < 1) return errorResponse("Page must be a positive whole number.", 400, { page: "Enter a valid page number." });
    if (!Number.isInteger(requestedLimit) || requestedLimit < 1) return errorResponse("Limit must be a positive whole number.", 400, { limit: "Enter a valid page size." });
    if (!["all", "paid", "partial", "pending"].includes(status)) return errorResponse("Choose a valid payment status.", 400, { status: "Choose a valid payment status." });
    if (method && !methods.includes(method)) return errorResponse("Choose a valid payment method.", 400, { method: "Choose a valid payment method." });
    if (month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return errorResponse("Month must use YYYY-MM format.", 400, { month: "Enter a valid month." });
    if (memberId && !mongoose.isObjectIdOrHexString(memberId)) return errorResponse("Member id is invalid.", 400, { memberId: "Choose a valid member." });
    await connectToDatabase();
    const filter = { ...paymentStatusMatch(status) };
    if (memberId) filter.memberId = memberId;
    if (method) filter.method = method;
    if (month) {
      const [year, monthNumber] = month.split("-").map(Number);
      filter.paymentDate = { $gte: new Date(Date.UTC(year, monthNumber - 1, 1)), $lt: new Date(Date.UTC(year, monthNumber, 1)) };
    }
    if (search) {
      const members = await Member.find({ fullName: new RegExp(escapeRegex(search), "i") }).distinct("_id");
      filter.memberId = { ...(memberId ? { $eq: memberId } : {}), $in: members };
    }
    const limit = Math.min(requestedLimit, 50);
    const [records, total] = await Promise.all([
      Payment.find(filter).populate("memberId", "fullName").populate("planId", "name").sort({ paymentDate: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Payment.countDocuments(filter),
    ]);
    return successResponse({ items: records.map(serializePayment), total, page, limit });
  } catch (error) { return handlePaymentError(error); }
}
