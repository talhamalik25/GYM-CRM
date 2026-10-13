export function derivePaymentStatus(amountPaid, amountDue) {
  if (Number(amountPaid) >= Number(amountDue)) return "Paid";
  if (Number(amountPaid) > 0) return "Partial";
  return "Pending";
}

