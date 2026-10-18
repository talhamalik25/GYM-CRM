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
import { scopedTenantFilter } from "../lib/tenantQuery.js";
import connectToDatabase from "../lib/db.js";
import { recordMemberPayment, LedgerError } from "../lib/paymentLedger.js";

const configuredTestUri = process.env.MONGODB_TEST_URI;

function isolatedTestUri() {
  if (!configuredTestUri) return null;
  const uri = new URL(configuredTestUri);
  uri.pathname = `/fitivo_tenant_isolation_test_${process.pid}`;
  return uri.toString();
}

const testUri = isolatedTestUri();

test("synthetic gym A queries cannot read, update, or delete gym B records", { skip: !testUri }, async () => {
  const priorMongoUri = process.env.MONGODB_URI;
  process.env.MONGODB_URI = testUri;
  const suffix = `${process.pid}-${randomUUID()}`;
  const gyms = [];
  try {
    await connectToDatabase();
    await Promise.all([Gym.init(), Member.init(), Plan.init(), Subscription.init(), Payment.init(), Attendance.init(), Trainer.init()]);
    const gymA = await Gym.create({ name: `Isolation A ${suffix}`, slug: `isolation-a-${suffix}` });
    const gymB = await Gym.create({ name: `Isolation B ${suffix}`, slug: `isolation-b-${suffix}` });
    gyms.push(gymA._id, gymB._id);

    const [planA, planB] = await Promise.all([
      Plan.create({ gymId: gymA._id, name: "Shared plan name", price: 1000, durationDays: 30 }),
      Plan.create({ gymId: gymB._id, name: "Shared plan name", price: 1000, durationDays: 30 }),
    ]);
    const [memberA, memberB] = await Promise.all([
      Member.create({ gymId: gymA._id, fullName: "Synthetic A", phone: "5550001234", gender: "Other", planId: planA._id, startDate: new Date(), expiryDate: new Date() }),
      Member.create({ gymId: gymB._id, fullName: "Synthetic B", phone: "5550001234", gender: "Other", planId: planB._id, startDate: new Date(), expiryDate: new Date() }),
    ]);
    const key = `shared-${suffix}`;
    const subscriptionA = (await Subscription.create([{ gymId: gymA._id, memberId: memberA._id, planId: planA._id, startDate: new Date(), expiryDate: new Date(), originalPrice: 1000, agreedPrice: 1000, planSnapshot: { name: "Shared plan name", durationDays: 30, originalPrice: 1000, agreedPrice: 1000 }, createKey: key, createFingerprint: key }]))[0];
    const subscriptionB = (await Subscription.create([{ gymId: gymB._id, memberId: memberB._id, planId: planB._id, startDate: new Date(), expiryDate: new Date(), originalPrice: 1000, agreedPrice: 1000, planSnapshot: { name: "Shared plan name", durationDays: 30, originalPrice: 1000, agreedPrice: 1000 }, createKey: key, createFingerprint: key }]))[0];
    await Payment.create({ gymId: gymA._id, memberId: memberA._id, planId: planA._id, subscriptionId: subscriptionA._id, amountDue: 1000, amountPaid: 100, method: "cash", paymentDate: new Date(), receiptNumber: `FIT-A-${suffix}`, idempotencyKey: key });
    const paymentB = await Payment.create({ gymId: gymB._id, memberId: memberB._id, planId: planB._id, subscriptionId: subscriptionB._id, amountDue: 1000, amountPaid: 100, method: "cash", paymentDate: new Date(), receiptNumber: `FIT-B-${suffix}`, idempotencyKey: key });
    const attendances = await Promise.all([
      Attendance.create({ gymId: gymA._id, memberId: memberA._id, date: "2026-10-18", checkInAt: new Date() }),
      Attendance.create({ gymId: gymB._id, memberId: memberB._id, date: "2026-10-18", checkInAt: new Date() }),
    ]);
    const attendanceB = attendances[1];

    assert.deepEqual((await Member.find(scopedTenantFilter(gymA._id))).map((member) => String(member._id)), [String(memberA._id)]);
    assert.equal(await Member.findOne(scopedTenantFilter(gymA._id, { _id: memberB._id })), null);
    assert.equal((await Plan.findOne(scopedTenantFilter(gymA._id, { _id: planB._id }))), null);
    assert.equal(await Payment.findOne(scopedTenantFilter(gymA._id, { _id: paymentB._id })), null);
    assert.equal((await Payment.find(scopedTenantFilter(gymA._id, { idempotencyKey: key }))).length, 1);
    assert.equal(await Attendance.findOne(scopedTenantFilter(gymA._id, { _id: attendanceB._id })), null);
    assert.equal((await Attendance.find(scopedTenantFilter(gymA._id))).length, 1);
    await assert.rejects(recordMemberPayment(null, {
      gymId: gymA._id, memberId: memberA._id, subscriptionId: subscriptionB._id,
      renewalKey: key, amountPaid: 100, method: "cash", paymentDate: new Date(), idempotencyKey: `cross-${suffix}`,
    }), (error) => error instanceof LedgerError && error.status === 404);
    const update = await Member.updateOne(scopedTenantFilter(gymA._id, { _id: memberB._id }), { $set: { fullName: "Changed" } });
    const deletion = await Member.deleteOne(scopedTenantFilter(gymA._id, { _id: memberB._id }));
    assert.equal(update.matchedCount, 0);
    assert.equal(deletion.deletedCount, 0);
    assert.equal((await Member.findById(memberB._id)).fullName, "Synthetic B");
  } finally {
    if (mongoose.connection.readyState === 1 && gyms.length) {
      await Promise.all([
        Member.deleteMany({ gymId: { $in: gyms } }), Plan.deleteMany({ gymId: { $in: gyms } }),
        Subscription.deleteMany({ gymId: { $in: gyms } }), Payment.deleteMany({ gymId: { $in: gyms } }),
        Attendance.deleteMany({ gymId: { $in: gyms } }), Trainer.deleteMany({ gymId: { $in: gyms } }),
        Gym.deleteMany({ _id: { $in: gyms } }),
      ]);
    }
    await mongoose.disconnect();
    if (priorMongoUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = priorMongoUri;
  }
});
