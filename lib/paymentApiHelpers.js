import { errorResponse } from "./planApiResponse";

export function handlePaymentError(error) {
  if (error?.code === 11000) return errorResponse("A payment with this receipt number already exists.", 409, { receiptNumber: "Please retry this payment." });
  if (error?.name === "ValidationError") {
    const fields = Object.fromEntries(Object.entries(error.errors || {}).map(([key, value]) => [key, value.message]));
    return errorResponse("Please check the payment details and try again.", 400, fields);
  }
  console.error("Payments API error:", error?.message || "Unknown error");
  return errorResponse("Something went wrong while accessing payments. Please try again.", 500);
}

export function serializePayment(payment) {
  const member = payment.memberId && typeof payment.memberId === "object" ? payment.memberId : null;
  const plan = payment.planId && typeof payment.planId === "object" ? payment.planId : null;
  const date = payment.paymentDate ? new Date(payment.paymentDate).toISOString().slice(0, 10) : "";
  return {
    _id: String(payment._id), receiptNumber: payment.receiptNumber,
    memberId: String(member?._id || payment.memberId), planId: String(plan?._id || payment.planId),
    member: member ? { id: String(member._id), fullName: member.fullName } : null,
    plan: plan ? { id: String(plan._id), name: plan.name } : null,
    amountDue: payment.amountDue, amountPaid: payment.amountPaid, method: payment.method,
    paymentDate: date, date, notes: payment.notes || "", createdAt: payment.createdAt,
  };
}

export function paymentStatusMatch(status) {
  if (status === "paid") return { $expr: { $gte: ["$amountPaid", "$amountDue"] } };
  if (status === "partial") return { $expr: { $and: [{ $gt: ["$amountPaid", 0] }, { $lt: ["$amountPaid", "$amountDue"] }] } };
  if (status === "pending") return { amountPaid: 0, $expr: { $gt: ["$amountDue", 0] } };
  return {};
}

export function isDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

