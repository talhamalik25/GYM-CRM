import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { calculateOutstandingBalance } from "../lib/paymentRules.js";
import { LedgerError, recordMemberPayment, runLedgerTransaction } from "../lib/paymentLedger.js";
import connectToDatabase from "../lib/db.js";
import Member from "../models/Member.js";
import Payment from "../models/Payment.js";
import Plan from "../models/Plan.js";
import Subscription from "../models/Subscription.js";
import Counter from "../models/Counter.js";

const configuredTestUri = process.env.MONGODB_TEST_URI;

function isolatedTestUri() {
  if (!configuredTestUri) return null;
  const uri = new URL(configuredTestUri);
  uri.pathname = `/fitivo_payment_ledger_test_${process.pid}`;
  return uri.toString();
}

const testUri = isolatedTestUri();

test("MongoDB payment ledger transactions remain consistent under retries and concurrent installments", { skip: !testUri }, async () => {
  process.env.MONGODB_URI = testUri;
  const suffix = `${process.pid}-${randomUUID()}`;
  let plan;
  let member;
  const subscriptionIds = [];

  const makeSubscription = async (amount, label) => {
    const key = `test-${suffix}-${label}`;
    const planSnapshot = { name: "Integration Test Plan", durationDays: 30, originalPrice: amount, agreedPrice: amount };
    const subscription = (await Subscription.create([{
      memberId: member._id, planId: plan._id, startDate: new Date("2026-01-01T00:00:00.000Z"),
      expiryDate: new Date("2026-01-30T00:00:00.000Z"), originalPrice: amount, agreedPrice: amount,
      planSnapshot, status: "active", createKey: key, createFingerprint: key,
      renewalHistory: [{ renewalKey: key, requestFingerprint: key, planId: plan._id, planSnapshot, startDate: new Date("2026-01-01T00:00:00.000Z"), expiryDate: new Date("2026-01-30T00:00:00.000Z") }],
    }]))[0];
    subscriptionIds.push(subscription._id);
    return { subscription, renewalKey: key };
  };

  const postPayment = (subscription, renewalKey, key, amountPaid) => runLedgerTransaction((session) => recordMemberPayment(session, {
    memberId: String(member._id), subscriptionId: String(subscription._id), renewalKey,
    amountPaid, method: "cash", paymentDate: new Date("2026-10-18T00:00:00.000Z"),
    idempotencyKey: key, notes: "integration test",
  }));

  try {
    await connectToDatabase();
    await Promise.all([Payment.init(), Subscription.init(), Member.init(), Plan.init()]);
    plan = await Plan.create({ name: `Integration ${suffix}`, price: 10000, durationDays: 30 });
    member = await Member.create({
      fullName: "Ledger Integration Member", phone: `+1555${String(Date.now()).slice(-7)}`,
      email: `ledger-${suffix}@example.test`, gender: "Prefer not to say", planId: plan._id,
      startDate: new Date("2026-01-01T00:00:00.000Z"), expiryDate: new Date("2026-01-30T00:00:00.000Z"),
    });
    const full = await makeSubscription(10000, "full");
    const fullKey = `full-payment-${suffix}`;
    const fullResult = await postPayment(full.subscription, full.renewalKey, fullKey, 10000);
    assert.equal(fullResult.duplicate, false);
    assert.equal(calculateOutstandingBalance(10000, await Payment.find({ subscriptionId: full.subscription._id }).lean()).outstanding, 0);
    assert.equal((await postPayment(full.subscription, full.renewalKey, fullKey, 10000)).duplicate, true);
    await assert.rejects(postPayment(full.subscription, full.renewalKey, fullKey, 9999), LedgerError);

    const partial = await makeSubscription(10000, "partial");
    await postPayment(partial.subscription, partial.renewalKey, `partial-a-${suffix}`, 3500);
    await postPayment(partial.subscription, partial.renewalKey, `partial-b-${suffix}`, 2500);
    assert.equal(calculateOutstandingBalance(10000, await Payment.find({ subscriptionId: partial.subscription._id }).lean()).outstanding, 4000);
    await assert.rejects(postPayment(partial.subscription, partial.renewalKey, `partial-over-${suffix}`, 4001), LedgerError);

    const concurrent = await makeSubscription(10000, "concurrent");
    const race = await Promise.allSettled([
      postPayment(concurrent.subscription, concurrent.renewalKey, `race-a-${suffix}`, 6000),
      postPayment(concurrent.subscription, concurrent.renewalKey, `race-b-${suffix}`, 6000),
    ]);
    const committed = race.filter((result) => result.status === "fulfilled").length;
    const concurrentPayments = await Payment.find({ subscriptionId: concurrent.subscription._id }).lean();
    assert.equal(committed, 1);
    assert.ok(concurrentPayments.reduce((sum, payment) => sum + payment.amountPaid, 0) <= 10000);

    const rollbackKey = `rollback-${suffix}`;
    const rollbackPaymentKey = `rollback-payment-${suffix}`;
    await assert.rejects(runLedgerTransaction(async (session) => {
      const subscription = (await Subscription.create([{
        memberId: member._id, planId: plan._id, startDate: new Date(), expiryDate: new Date(),
        originalPrice: 10000, agreedPrice: 10000,
        planSnapshot: { name: "Rollback", durationDays: 30, originalPrice: 10000, agreedPrice: 10000 },
        createKey: rollbackKey, createFingerprint: rollbackKey,
        renewalHistory: [{ renewalKey: rollbackKey, requestFingerprint: rollbackKey, planId: plan._id, planSnapshot: { name: "Rollback", durationDays: 30, originalPrice: 10000, agreedPrice: 10000 }, startDate: new Date(), expiryDate: new Date() }],
      }], { session }))[0];
      await Payment.create([{
        memberId: member._id, planId: plan._id, subscriptionId: subscription._id, renewalKey: rollbackKey,
        amountDue: 10000, amountPaid: 1000, method: "cash", paymentDate: new Date(),
        receiptNumber: `FIT-TEST-${suffix}`, idempotencyKey: rollbackPaymentKey,
        requestFingerprint: rollbackPaymentKey,
      }], { session });
      throw new Error("simulate a payment creation failure");
    }), /simulate a payment creation failure/);
    assert.equal(await Subscription.exists({ createKey: rollbackKey }), null);
    assert.equal(await Payment.exists({ idempotencyKey: rollbackPaymentKey }), null);

    const totalCharges = 30000;
    const allPayments = await Payment.find({ subscriptionId: { $in: subscriptionIds } }).lean();
    const summaryBalance = calculateOutstandingBalance(totalCharges, allPayments).outstanding;
    const duesBalance = [full.subscription, partial.subscription, concurrent.subscription].reduce((sum, invoice) => {
      const rows = allPayments.filter((payment) => String(payment.subscriptionId) === String(invoice._id));
      return sum + calculateOutstandingBalance(invoice.agreedPrice, rows).outstanding;
    }, 0);
    assert.equal(summaryBalance, duesBalance);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await Payment.deleteMany({ memberId: member?._id });
      await Subscription.deleteMany({ $or: [{ memberId: member?._id }, { _id: { $in: subscriptionIds } }] });
      if (member) await Member.deleteOne({ _id: member._id });
      if (plan) await Plan.deleteOne({ _id: plan._id });
      await Counter.deleteOne({ name: "paymentReceipt" });
    }
    await mongoose.disconnect();
  }
});
