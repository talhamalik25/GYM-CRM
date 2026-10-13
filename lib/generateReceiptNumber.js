import Counter from "../models/Counter";

export default async function generateReceiptNumber() {
  let counter;
  try {
    counter = await Counter.findOneAndUpdate(
      { name: "paymentReceipt" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    // Concurrent first-time upserts can race on the unique name index; the winner created the counter, so increment it now.
    if (error?.code !== 11000) throw error;
    counter = await Counter.findOneAndUpdate({ name: "paymentReceipt" }, { $inc: { seq: 1 } }, { new: true });
  }
  // A failed payment may leave a gap after this number has been issued; uniqueness is more important than gapless numbering.
  return `FIT-${String(counter.seq).padStart(4, "0")}`;
}
