import mongoose from "mongoose";
import connectToDatabase from "../lib/db.js";
import { getGymDate } from "../lib/gymDate.js";
import Attendance from "../models/Attendance.js";
import Member from "../models/Member.js";

try {
  await connectToDatabase();
  await Attendance.init();
  const members = await Member.find().sort({ createdAt: 1 }).limit(6).select("_id");
  if (members.length < 3) throw new Error("At least three real members are required before seeding attendance.");

  const now = new Date();
  let inserted = 0;
  for (let index = 0; index < members.length; index += 1) {
    // Leave the first two check-ins open today; make later sample days complete check-ins.
    const dayOffset = index < 2 ? 0 : index - 1;
    const checkInAt = new Date(now.getTime() - dayOffset * 86400000 - index * 60000);
    const date = getGymDate(checkInAt);
    const existing = await Attendance.exists({ memberId: members[index]._id, date });
    if (existing) continue;
    await Attendance.create({
      memberId: members[index]._id,
      date,
      checkInAt,
      checkOutAt: index < 2 ? null : new Date(checkInAt.getTime() + (45 + index * 5) * 60000),
    });
    inserted += 1;
  }
  console.log(`Inserted ${inserted} sample attendance record(s) for real members.`);
} catch (error) {
  console.error("Could not seed attendance:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

