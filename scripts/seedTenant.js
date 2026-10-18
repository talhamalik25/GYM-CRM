import mongoose from "mongoose";
import Gym from "../models/Gym.js";
import Member from "../models/Member.js";
import Plan from "../models/Plan.js";
import Subscription from "../models/Subscription.js";
import Payment from "../models/Payment.js";
import Attendance from "../models/Attendance.js";
import Trainer from "../models/Trainer.js";

export async function getSeedTenant() {
  const gymId = process.env.GYM_ID;
  if (!mongoose.isObjectIdOrHexString(gymId)) {
    throw new Error("Set GYM_ID to an existing gym before running a seed script.");
  }
  const gym = await Gym.findOne({ _id: gymId, status: "active" }).select("_id").lean();
  if (!gym) throw new Error("GYM_ID must identify an active gym.");
  const ownershipFilter = { $or: [{ gymId: { $exists: false } }, { gymId: null }] };
  const unownedCounts = await Promise.all([
    Member.countDocuments(ownershipFilter), Plan.countDocuments(ownershipFilter), Subscription.countDocuments(ownershipFilter),
    Payment.countDocuments(ownershipFilter), Attendance.countDocuments(ownershipFilter), Trainer.countDocuments(ownershipFilter),
  ]);
  if (unownedCounts.some(Boolean)) {
    throw new Error("Seed scripts are disabled while legacy gym records lack tenant ownership. Complete the reviewed migration first.");
  }
  return gym;
}
