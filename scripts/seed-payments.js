import mongoose from "mongoose";
import connectToDatabase from "../lib/db.js";
import generateReceiptNumber from "../lib/generateReceiptNumber.js";
import Member from "../models/Member.js";
import Payment from "../models/Payment.js";
import Subscription from "../models/Subscription.js";
import { getSeedTenant } from "./seedTenant.js";

try {
  await connectToDatabase();
  const gym = await getSeedTenant();
  const members = (await Member.find({ gymId: gym._id }).populate({ path: "planId", match: { gymId: gym._id }, select: "name price durationDays" }).sort({ createdAt: 1 }))
    .filter((member) => Number.isSafeInteger(member.planId?.price) && member.planId.price >= 2)
    .slice(0, 3);
  if (members.length < 3 || members.some((member) => !member.planId)) {
    throw new Error("At least three members with assigned plans are required. Seed plans and members first.");
  }

  const marker = "Seed payment sample";
  const invoiceKeys = members.map((member) => `seed-payment-${member._id}`);
  const [legacySamples, existingInvoices] = await Promise.all([
    Payment.countDocuments({ gymId: gym._id, notes: { $regex: `^${marker}` } }),
    Subscription.countDocuments({ gymId: gym._id, createKey: { $in: invoiceKeys } }),
  ]);
  if (legacySamples || existingInvoices) {
    console.log("Skipped seeding because sample payment or invoice records already exist.");
  } else {
    const paidAmounts = [members[0].planId.price, Math.floor(members[1].planId.price / 2), 0];
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (let index = 0; index < members.length; index += 1) {
          const member = members[index];
          const plan = member.planId;
          const key = invoiceKeys[index];
          const planSnapshot = { name: plan.name, durationDays: plan.durationDays, originalPrice: plan.price, agreedPrice: plan.price };
          const subscription = (await Subscription.create([{
            gymId: gym._id,
            memberId: member._id, planId: plan._id, startDate: member.startDate, expiryDate: member.expiryDate,
            originalPrice: plan.price, agreedPrice: plan.price, planSnapshot, status: "pending",
            createKey: key, createFingerprint: `${key}:${plan.price}`,
            renewalHistory: [{ renewalKey: key, requestFingerprint: `${key}:${plan.price}`, planId: plan._id, planSnapshot, startDate: member.startDate, expiryDate: member.expiryDate }],
          }], { session }))[0];
          if (paidAmounts[index] > 0) {
            await Payment.create([{
              gymId: gym._id,
              memberId: member._id, planId: plan._id, subscriptionId: subscription._id, renewalKey: key,
              amountDue: plan.price, amountPaid: paidAmounts[index], method: "cash", paymentDate: new Date(),
              receiptNumber: await generateReceiptNumber({ session }), idempotencyKey: `seed-${member._id}`,
              requestFingerprint: `${key}:${paidAmounts[index]}`, notes: `${marker} ${index === 0 ? "Paid" : "Partial"}`,
            }], { session });
          }
        }
      });
    } finally {
      await session.endSession();
    }
    console.log("Inserted two subscription-linked sample payments and one pending invoice for database members.");
  }
} catch (error) {
  console.error("Could not seed payments:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
