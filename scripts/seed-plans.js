import connectToDatabase from "../lib/db.js";
import Plan from "../models/Plan.js";
import mongoose from "mongoose";

const samplePlans = [
  { name: "Basic", price: 5000, durationDays: 30, description: "A simple membership for regular gym access." },
  { name: "Standard", price: 13500, durationDays: 90, description: "Three months of consistent training." },
  { name: "Premium", price: 48000, durationDays: 365, description: "A full year of uninterrupted gym access." },
];

try {
  await connectToDatabase();
  const count = await Plan.countDocuments();
  if (count === 0) {
    await Plan.insertMany(samplePlans);
    console.log("Inserted 3 sample plans.");
  } else {
    console.log(`Skipped seeding because ${count} plan(s) already exist.`);
  }
} catch (error) {
  console.error("Could not seed plans:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
