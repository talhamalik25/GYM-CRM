"use client";

import { Printer } from "lucide-react";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Modal from "../ui/modal";

function formatCurrency(amount) {
  return `PKR ${Number(amount || 0).toLocaleString("en-PK")}`;
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}T12:00:00Z`));
}

function statusTone(status) {
  if (status === "Paid") return "success";
  if (status === "Partial") return "warning";
  return "neutral";
}

export default function PaymentReceiptModal({ receipt, onClose }) {
  return (
    <Modal open={Boolean(receipt)} onClose={onClose} title="Payment Receipt" description="Receipt details for this payment." className="payment-receipt-modal">
      {receipt && (
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <span className="text-xl font-semibold tracking-tight text-ink">Fitivo</span>
            <Badge tone={statusTone(receipt.status)}>{receipt.status}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <span className="text-ink-muted">Receipt number</span><strong className="text-right text-ink">{receipt.receiptNumber}</strong>
            <span className="text-ink-muted">Member</span><strong className="text-right text-ink">{receipt.memberName}</strong>
            <span className="text-ink-muted">Plan</span><strong className="text-right text-ink">{receipt.planName}</strong>
            <span className="text-ink-muted">Amount paid</span><strong className="text-right text-ink">{formatCurrency(receipt.amountPaid)}</strong>
            <span className="text-ink-muted">Method</span><strong className="text-right text-ink">{receipt.method}</strong>
            <span className="text-ink-muted">Date</span><strong className="text-right text-ink">{formatDate(receipt.date)}</strong>
          </div>
          <div className="payment-receipt-actions flex justify-end gap-3 border-t border-line pt-5">
            <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
            <Button type="button" onClick={() => window.print()}><Printer size={16} aria-hidden="true" />Print</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
