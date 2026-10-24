import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null, index: true },
  gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required() { return this.isNew; } },
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true },
  date: {
    type: String,
    required: true,
    match: [/^\d{4}-\d{2}-\d{2}$/, "Attendance date must use YYYY-MM-DD format."],
  },
  checkInAt: { type: Date, required: true },
  checkOutAt: { type: Date, default: null },
  overrideExpired: { type: Boolean, default: false },
}, { timestamps: true });

attendanceSchema.index({ gymId: 1, memberId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: -1, checkInAt: -1 });

export default mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
