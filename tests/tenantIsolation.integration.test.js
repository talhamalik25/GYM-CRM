import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import Gym from "../models/Gym.js";
import Member from "../models/Member.js";
import Plan from "../models/Plan.js";
import Subscription from "../models/Subscription.js";
import Payment from "../models/Payment.js";
import Attendance from "../models/Attendance.js";
import Trainer from "../models/Trainer.js";
import Counter from "../models/Counter.js";
import { scopedTenantFilter } from "../lib/tenantQuery.js";
import connectToDatabase from "../lib/db.js";
import { recordMemberPayment, runLedgerTransaction, LedgerError } from "../lib/paymentLedger.js";
import generateReceiptNumber from "../lib/generateReceiptNumber.js";
import { isolatedTestUri } from "./testDatabaseConfig.js";

const configuredTestUri = process.env.MONGODB_TEST_URI;
const testUri = isolatedTestUri(configuredTestUri, "tenant_isolation");

test("synthetic gym A queries cannot read, update, or delete gym B records", { skip: !testUri }, async () => {
  const priorMongoUri = process.env.MONGODB_URI;
  process.env.MONGODB_URI = testUri;
  const suffix = `${process.pid}-${randomUUID()}`;
  const gyms = [];
  try {
    await connectToDatabase();
    await Promise.all([Gym.init(), Member.init(), Plan.init(), Subscription.init(), Payment.init(), Attendance.init(), Trainer.init(), Counter.init()]);
    const gymA = await Gym.create({ name: `Isolation A ${suffix}`, slug: `isolation-a-${suffix}` });
    const gymB = await Gym.create({ name: `Isolation B ${suffix}`, slug: `isolation-b-${suffix}` });
    gyms.push(gymA._id, gymB._id);

    const receiptCounts = { [String(gymA._id)]: 10, [String(gymB._id)]: 7 };
    const receipts = await Promise.all(Object.entries(receiptCounts).flatMap(([gymId, count]) =>
      Array.from({ length: count }, () => generateReceiptNumber({ gymId })),
    ));
    assert.equal(new Set(receipts).size, receipts.length);
    for (const [gymId, count] of Object.entries(receiptCounts)) {
      const sequence = receipts.filter((receipt) => receipt.startsWith(`FIT-${gymId}-`))
        .map((receipt) => Number(receipt.slice(`FIT-${gymId}-`.length)))
        .sort((a, b) => a - b);
      assert.deepEqual(sequence, Array.from({ length: count }, (_, index) => index + 1));
    }
    assert.equal(await Counter.countDocuments({ gymId: { $in: gyms } }), 2);

    const [planA, planB] = await Promise.all([
      Plan.create({ gymId: gymA._id, name: "Shared plan name", price: 1000, durationDays: 30 }),
      Plan.create({ gymId: gymB._id, name: "Shared plan name", price: 1000, durationDays: 30 }),
    ]);
    const [memberA, memberB] = await Promise.all([
      Member.create({ gymId: gymA._id, fullName: "Synthetic A", phone: "5550001234", gender: "Other", planId: planA._id, startDate: new Date(), expiryDate: new Date() }),
      Member.create({ gymId: gymB._id, fullName: "Synthetic B", phone: "5550001234", gender: "Other", planId: planB._id, startDate: new Date(), expiryDate: new Date() }),
    ]);
    const key = `shared-${suffix}`;
    const planSnapshot = { name: "Shared plan name", durationDays: 30, originalPrice: 1000, agreedPrice: 1000 };
    const startDate = new Date();
    const expiryDate = new Date(Date.now() + 30 * 86400000);
    const subscriptionA = (await Subscription.create([{
      gymId: gymA._id, memberId: memberA._id, planId: planA._id, startDate, expiryDate,
      originalPrice: 1000, agreedPrice: 1000, planSnapshot, createKey: key, createFingerprint: key,
      renewalHistory: [{ renewalKey: key, requestFingerprint: key, planId: planA._id, planSnapshot, startDate, expiryDate }],
    }]))[0];
    const subscriptionB = (await Subscription.create([{
      gymId: gymB._id, memberId: memberB._id, planId: planB._id, startDate, expiryDate,
      originalPrice: 1000, agreedPrice: 1000, planSnapshot, createKey: key, createFingerprint: key,
      renewalHistory: [{ renewalKey: key, requestFingerprint: key, planId: planB._id, planSnapshot, startDate, expiryDate }],
    }]))[0];
    const [trainerA, trainerB] = await Promise.all([
      Trainer.create({ gymId: gymA._id, fullName: "Trainer A", email: `a-${suffix}@example.test`, phone: "+15550000001", specialization: "Strength", joiningDate: startDate }),
      Trainer.create({ gymId: gymB._id, fullName: "Trainer B", email: `b-${suffix}@example.test`, phone: "+15550000002", specialization: "Strength", joiningDate: startDate }),
    ]);
    await Payment.create({ gymId: gymA._id, memberId: memberA._id, planId: planA._id, subscriptionId: subscriptionA._id, amountDue: 1000, amountPaid: 100, method: "cash", paymentDate: new Date(), receiptNumber: `FIT-A-${suffix}`, idempotencyKey: key });
    const paymentB = await Payment.create({ gymId: gymB._id, memberId: memberB._id, planId: planB._id, subscriptionId: subscriptionB._id, amountDue: 1000, amountPaid: 100, method: "cash", paymentDate: new Date(), receiptNumber: `FIT-B-${suffix}`, idempotencyKey: key });
    const attendances = await Promise.all([
      Attendance.create({ gymId: gymA._id, memberId: memberA._id, date: "2026-10-18", checkInAt: new Date() }),
      Attendance.create({ gymId: gymB._id, memberId: memberB._id, date: "2026-10-18", checkInAt: new Date() }),
    ]);
    const attendanceB = attendances[1];

    assert.deepEqual((await Member.find(scopedTenantFilter(gymA._id))).map((member) => String(member._id)), [String(memberA._id)]);
    assert.equal(await Member.findOne(scopedTenantFilter(gymA._id, { _id: memberB._id })), null);
    assert.deepEqual((await Plan.find(scopedTenantFilter(gymA._id))).map((plan) => String(plan._id)), [String(planA._id)]);
    assert.equal((await Plan.findOne(scopedTenantFilter(gymA._id, { _id: planB._id }))), null);
    assert.deepEqual((await Subscription.find(scopedTenantFilter(gymA._id))).map((subscription) => String(subscription._id)), [String(subscriptionA._id)]);
    assert.equal(await Subscription.findOne(scopedTenantFilter(gymA._id, { _id: subscriptionB._id })), null);
    assert.deepEqual((await Trainer.find(scopedTenantFilter(gymA._id))).map((trainer) => String(trainer._id)), [String(trainerA._id)]);
    assert.equal(await Trainer.findOne(scopedTenantFilter(gymA._id, { _id: trainerB._id })), null);
    assert.deepEqual((await Payment.find(scopedTenantFilter(gymA._id))).map((payment) => String(payment.gymId)), [String(gymA._id)]);
    assert.deepEqual((await Attendance.find(scopedTenantFilter(gymA._id))).map((attendance) => String(attendance.gymId)), [String(gymA._id)]);
    assert.equal((await Member.find(scopedTenantFilter(gymA._id, { gymId: gymB._id }))).length, 0);
    assert.equal(await Member.findOne(scopedTenantFilter(gymA._id, { _id: memberB._id, gymId: gymB._id })), null);
    assert.equal(await Attendance.countDocuments(scopedTenantFilter(gymA._id, { memberId: memberB._id })), 0, "foreign member lookup for check-in creation must fail");
    assert.equal(await Payment.findOne(scopedTenantFilter(gymA._id, { _id: paymentB._id })), null);
    assert.equal((await Payment.find(scopedTenantFilter(gymA._id, { idempotencyKey: key }))).length, 1);
    assert.equal(await Attendance.findOne(scopedTenantFilter(gymA._id, { _id: attendanceB._id })), null);
    assert.equal((await Attendance.find(scopedTenantFilter(gymA._id))).length, 1);
    await assert.rejects(recordMemberPayment(null, {
      gymId: gymA._id, memberId: memberA._id, subscriptionId: subscriptionB._id,
      renewalKey: key, amountPaid: 100, method: "cash", paymentDate: new Date(), idempotencyKey: `cross-${suffix}`,
    }), (error) => error instanceof LedgerError && error.status === 404);
    await assert.rejects(recordMemberPayment(null, {
      gymId: gymA._id, memberId: memberB._id, subscriptionId: subscriptionA._id,
      renewalKey: key, amountPaid: 100, method: "cash", paymentDate: new Date(), idempotencyKey: `cross-member-${suffix}`,
    }), (error) => error instanceof LedgerError && error.status === 404);
    const crossGymPlanSubscription = (await Subscription.create([{
      gymId: gymA._id, memberId: memberA._id, planId: planB._id, startDate, expiryDate,
      originalPrice: 1000, agreedPrice: 1000, planSnapshot,
      createKey: `cross-plan-${suffix}`, createFingerprint: `cross-plan-${suffix}`,
      renewalHistory: [{ renewalKey: `cross-plan-${suffix}`, requestFingerprint: `cross-plan-${suffix}`, planId: planB._id, planSnapshot, startDate, expiryDate }],
    }]))[0];
    await assert.rejects(recordMemberPayment(null, {
      gymId: gymA._id, memberId: memberA._id, subscriptionId: crossGymPlanSubscription._id,
      renewalKey: `cross-plan-${suffix}`, amountPaid: 100, method: "cash", paymentDate: new Date(), idempotencyKey: `cross-plan-payment-${suffix}`,
    }), (error) => error instanceof LedgerError && error.status === 409);
    const ownPayment = await runLedgerTransaction((session) => recordMemberPayment(session, {
      gymId: gymA._id, memberId: memberA._id, subscriptionId: subscriptionA._id,
      renewalKey: key, amountPaid: 100, method: "cash", paymentDate: new Date(), idempotencyKey: `own-${suffix}`,
    }));
    assert.equal(ownPayment.duplicate, false);
    assert.equal(String(ownPayment.payment.gymId), String(gymA._id));
    const update = await Member.updateOne(scopedTenantFilter(gymA._id, { _id: memberB._id }), { $set: { fullName: "Changed" } });
    const deletion = await Member.deleteOne(scopedTenantFilter(gymA._id, { _id: memberB._id }));
    const subscriptionUpdate = await Subscription.updateOne(scopedTenantFilter(gymA._id, { _id: subscriptionB._id }), { $set: { status: "cancelled" } });
    assert.equal(update.matchedCount, 0);
    assert.equal(deletion.deletedCount, 0);
    assert.equal(subscriptionUpdate.matchedCount, 0);
    assert.equal((await Member.findById(memberB._id)).fullName, "Synthetic B");
  } finally {
    if (mongoose.connection.readyState === 1 && gyms.length) {
      await Promise.all([
        Member.deleteMany({ gymId: { $in: gyms } }), Plan.deleteMany({ gymId: { $in: gyms } }),
        Subscription.deleteMany({ gymId: { $in: gyms } }), Payment.deleteMany({ gymId: { $in: gyms } }),
        Attendance.deleteMany({ gymId: { $in: gyms } }), Trainer.deleteMany({ gymId: { $in: gyms } }),
        Counter.deleteMany({ gymId: { $in: gyms } }),
        Gym.deleteMany({ _id: { $in: gyms } }),
      ]);
    }
    await mongoose.disconnect();
    if (priorMongoUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = priorMongoUri;
  }
});
