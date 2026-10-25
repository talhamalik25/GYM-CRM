import mongoose from "mongoose";
import Counter from "../models/Counter.js";

export default async function generateReceiptNumber({ gymId } = {}) {
  if (!mongoose.isObjectIdOrHexString(gymId)) {
    throw new Error("A trusted gym id is required to generate a receipt number.");
  }

  const normalizedGymId = new mongoose.Types.ObjectId(gymId);
  const gymKey = normalizedGymId.toHexString();
  const counterName = `paymentReceipt:${gymKey}`;
  let counter;
  try {
    counter = await Counter.findOneAndUpdate(
      { gymId: normalizedGymId, name: counterName },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true },
    );
  } catch (error) {
    // Concurrent first-time upserts for one gym can race on the unique counter name.
    if (error?.code !== 11000) throw error;
    counter = await Counter.findOneAndUpdate({ gymId: normalizedGymId, name: counterName }, { $inc: { seq: 1 } }, { returnDocument: "after" });
  }
  // Reserve outside the payment transaction; aborted payments may leave gaps.
  // The full gym id keeps receipts unique across independent gym counters.
  return `FIT-${gymKey}-${String(counter.seq).padStart(4, "0")}`;
}
