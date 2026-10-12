import mongoose from "mongoose";
import connectToDatabase from "../lib/db.js";
import { getMembershipExpiryDate } from "../lib/membersService.js";
import { normalizeMemberPhone } from "../lib/memberApiHelpers.js";
import Member from "../models/Member.js";
import Plan from "../models/Plan.js";

const sampleMembers = [
  { fullName: "Amina Khan", phone: "+92 300 111 0001", email: "amina@example.com", gender: "Female" },
  { fullName: "Bilal Ahmed", phone: "+92 300 111 0002", email: "bilal@example.com", gender: "Male" },
  { fullName: "Sara Ali", phone: "+92 300 111 0003", email: "sara@example.com", gender: "Female" },
];

try {
  await connectToDatabase();
  const existingCount = await Member.countDocuments();
  if (existingCount > 0) {
    console.log(`Skipped seeding because ${existingCount} member(s) already exist.`);
  } else {
    const plans = await Plan.find({ isActive: true }).sort({ createdAt: 1 });
    if (!plans.length) throw new Error("Create at least one active plan before seeding members.");

    const startDateText = new Date().toISOString().slice(0, 10);
    const startDate = new Date(`${startDateText}T00:00:00.000Z`);
    const documents = sampleMembers.map((member, index) => {
      const plan = plans[index % plans.length];
      const expiryDateText = getMembershipExpiryDate(startDateText, plan.durationDays);
      return {
        ...member,
        phone: normalizeMemberPhone(member.phone),
        planId: plan._id,
        startDate,
        expiryDate: new Date(`${expiryDateText}T00:00:00.000Z`),
      };
    });
    await Member.insertMany(documents);
    console.log(`Inserted ${documents.length} sample members.`);
  }
} catch (error) {
  console.error("Could not seed members:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
