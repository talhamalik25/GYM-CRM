import mongoose from "mongoose";
import connectToDatabase from "../lib/db.js";
import generateReceiptNumber from "../lib/generateReceiptNumber.js";
import Member from "../models/Member.js";
import Payment from "../models/Payment.js";

try {
  await connectToDatabase();
  const members = (await Member.find().populate("planId", "name price").sort({ createdAt: 1 })).filter((member) => Number.isSafeInteger(member.planId?.price) && member.planId.price >= 2).slice(0, 3);
  if (members.length < 3 || members.some((member) => !member.planId)) {
    throw new Error("At least three members with assigned plans are required. Seed plans and members first.");
  }
  const marker = "Seed payment sample";
  const existing = await Payment.countDocuments({ notes: { $regex: `^${marker}` } });
  if (existing) {
    console.log(`Skipped seeding because ${existing} sample payment(s) already exist.`);
  } else {
    const paidAmounts = [members[0].planId.price, Math.floor(members[1].planId.price / 2), 0];
    for (let index = 0; index < 3; index += 1) {
      const member = members[index];
      await Payment.create({
        memberId: member._id,
        planId: member.planId._id,
        amountDue: member.planId.price,
        amountPaid: paidAmounts[index],
        method: "cash",
        paymentDate: new Date(),
        receiptNumber: await generateReceiptNumber(),
        notes: `${marker} ${["Paid", "Partial", "Pending"][index]}`,
      });
    }
    console.log("Inserted Paid, Partial, and Pending sample payments for database members.");
  }
} catch (error) {
  console.error("Could not seed payments:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
