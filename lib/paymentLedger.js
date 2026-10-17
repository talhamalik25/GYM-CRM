import mongoose from "mongoose";
import connectToDatabase from "./db";
import Payment from "../models/Payment";
import Subscription from "../models/Subscription";
import Member from "../models/Member";
import Plan from "../models/Plan";
import generateReceiptNumber from "./generateReceiptNumber";
import { calculateOutstandingBalance, isPaymentWithinBalance, makePaymentFingerprint } from "./paymentRules";

export class LedgerError extends Error {
  constructor(message, status = 409, fields = {}) {
    super(message);
    this.name = "LedgerError";
    this.status = status;
    this.fields = fields;
  }
}

export async function runLedgerTransaction(work) {
  await connectToDatabase();
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

export async function findIdempotentPayment(key, fingerprint, session) {
  const previous = await Payment.findOne({ idempotencyKey: key }).select("+requestFingerprint").session(session);
  if (!previous) return null;
  if (previous.requestFingerprint !== fingerprint) {
    throw new LedgerError("This payment request key was already used for different details.", 409);
  }
  return previous;
}

export async function sumTermPayments(subscriptionId, renewalKey, session) {
  const rows = await Payment.find({ subscriptionId, renewalKey }).select("amountPaid").session(session).lean();
  return rows.reduce((sum, payment) => sum + payment.amountPaid, 0);
}

export async function lockSubscriptionVersion(subscription, session) {
  const version = subscription.__v || 0;
  const locked = await Subscription.updateOne(
    { _id: subscription._id, __v: version },
    { $inc: { __v: 1 } },
    { session },
  );
  if (locked.modifiedCount !== 1) {
    throw new LedgerError("The subscription changed while recording this payment. Retry with the same request key.", 409);
  }
}

async function lockMemberVersion(member, session) {
  const locked = await Member.updateOne(
    { _id: member._id, __v: member.__v || 0 },
    { $inc: { __v: 1 } },
    { session },
  );
  if (locked.modifiedCount !== 1) {
    throw new LedgerError("The member's billing record changed. Retry with the same request key.", 409);
  }
}

export async function createTermPayment({
  session,
  subscription,
  term,
  amountPaid,
  method,
  paymentDate,
  idempotencyKey,
  requestFingerprint,
  notes = "",
}) {
  const previous = await findIdempotentPayment(idempotencyKey, requestFingerprint, session);
  if (previous) return { payment: previous, duplicate: true };

  const paid = await sumTermPayments(subscription._id, term.renewalKey, session);
  const agreedPrice = term.planSnapshot.agreedPrice;
  const outstanding = Math.max(0, agreedPrice - paid);
  if (!Number.isSafeInteger(amountPaid) || amountPaid <= 0) {
    throw new LedgerError("Payment must be a positive whole number of rupees.", 400, { amountPaid: "Enter a positive whole rupee amount." });
  }
  if (!isPaymentWithinBalance(amountPaid, outstanding)) {
    throw new LedgerError("Payment exceeds the outstanding balance.", 400, { amountPaid: `Outstanding balance is Rs. ${outstanding}.` });
  }

  await lockSubscriptionVersion(subscription, session);
  const payment = await Payment.create([{
    memberId: subscription.memberId,
    planId: term.planId,
    subscriptionId: subscription._id,
    renewalKey: term.renewalKey,
    amountDue: agreedPrice,
    amountPaid,
    method,
    paymentDate,
    receiptNumber: await generateReceiptNumber({ session }),
    idempotencyKey,
    requestFingerprint,
    notes,
  }], { session });
  return { payment: payment[0], duplicate: false, outstanding: outstanding - amountPaid };
}

export async function recordMemberPayment(session, input) {
  const fingerprint = makePaymentFingerprint(input);
  const previous = await findIdempotentPayment(input.idempotencyKey, fingerprint, session);
  if (previous) return { payment: previous, duplicate: true };

  const member = await Member.findById(input.memberId).session(session);
  if (!member) throw new LedgerError("The selected member was not found.", 404, { memberId: "Choose an existing member." });

  let subscription;
  let term;
  if (input.subscriptionId) {
    subscription = await Subscription.findById(input.subscriptionId).session(session);
    if (!subscription || String(subscription.memberId) !== String(member._id)) {
      throw new LedgerError("The selected invoice was not found for this member.", 404, { subscriptionId: "Choose an invoice for the selected member." });
    }
    term = subscription.renewalHistory.find((entry) => entry.renewalKey === input.renewalKey);
    if (!term) throw new LedgerError("The selected subscription term was not found.", 404, { renewalKey: "Choose a valid invoice term." });
  } else {
    const subscriptions = await Subscription.find({ memberId: member._id }).session(session);
    const openTerms = [];
    for (const candidate of subscriptions) {
      for (const candidateTerm of candidate.renewalHistory) {
        const payments = await Payment.find({ subscriptionId: candidate._id, renewalKey: candidateTerm.renewalKey }).select("amountPaid").session(session).lean();
        if (calculateOutstandingBalance(candidateTerm.planSnapshot.agreedPrice, payments).outstanding > 0) {
          openTerms.push({ subscription: candidate, term: candidateTerm });
        }
      }
    }
    if (openTerms.length > 1) {
      throw new LedgerError("Choose which outstanding invoice this payment applies to.", 409, { subscriptionId: "Select an invoice before recording payment." });
    }
    if (openTerms.length === 1) ({ subscription, term } = openTerms[0]);
    else if (subscriptions.length) {
      throw new LedgerError("This member has no outstanding subscription invoice.", 409, { memberId: "Create or renew a membership before recording another payment." });
    } else {
      const legacyHistory = await Payment.exists({ memberId: member._id, subscriptionId: null }).session(session);
      if (legacyHistory) {
        throw new LedgerError("This member has older unallocated payment history that must be reconciled before a new invoice can be created.", 409, { memberId: "Reconcile the existing payment history first." });
      }
      await lockMemberVersion(member, session);
      const plan = await Plan.findById(member.planId).session(session);
      if (!plan || !Number.isSafeInteger(plan.price) || plan.price < 1) {
        throw new LedgerError("The member's plan has no valid price for a new invoice.", 409, { memberId: "Assign a valid plan before recording payment." });
      }
      const invoiceKey = `legacy-invoice-${input.idempotencyKey}`;
      const startDate = new Date(member.startDate);
      const expiryDate = new Date(member.expiryDate);
      const planSnapshot = { name: plan.name, durationDays: plan.durationDays, originalPrice: plan.price, agreedPrice: plan.price };
      subscription = (await Subscription.create([{
        memberId: member._id, planId: plan._id, startDate, expiryDate,
        originalPrice: plan.price, agreedPrice: plan.price, planSnapshot,
        status: "pending", createKey: invoiceKey, createFingerprint: fingerprint,
        renewalHistory: [{ renewalKey: invoiceKey, requestFingerprint: fingerprint, planId: plan._id, planSnapshot, startDate, expiryDate }],
      }], { session }))[0];
      term = subscription.renewalHistory[0];
    }
  }

  return createTermPayment({
    session, subscription, term, amountPaid: input.amountPaid, method: input.method,
    paymentDate: input.paymentDate, idempotencyKey: input.idempotencyKey,
    requestFingerprint: fingerprint, notes: input.notes,
  });
}

export function paymentLedgerErrorResponse(error, errorResponse) {
  if (error instanceof LedgerError) return errorResponse(error.message, error.status, Object.keys(error.fields).length ? error.fields : undefined);
  if (error?.code === 20 || error?.codeName === "IllegalOperation" || /replica set|transaction numbers are only allowed/i.test(error?.message || "")) {
    return errorResponse("Atomic payment processing requires MongoDB transaction support. Configure MongoDB Atlas or another replica-set deployment.", 503);
  }
  return null;
}
