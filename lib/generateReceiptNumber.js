import Counter from "../models/Counter";

export default async function generateReceiptNumber() {
  const counter = await Counter.findOneAndUpdate(
    { name: "paymentReceipt" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  // A failed payment may leave a gap after this number has been issued; uniqueness is more important than gapless numbering.
  return `FIT-${String(counter.seq).padStart(4, "0")}`;
}
