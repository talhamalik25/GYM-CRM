import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
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

attendanceSchema.index({ memberId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: -1, checkInAt: -1 });

export default mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
