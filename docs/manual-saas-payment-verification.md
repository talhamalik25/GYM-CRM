# Manual SaaS payment verification

Fitivo invoices are paid outside the application through payment instructions configured by a Superadmin. A Gym Owner may submit a transaction reference as a claim, but it remains unverified and does not change the invoice status or grant subscription access.

An authorized Superadmin must independently check the receiving account, enter the verified amount and transaction reference, record verification notes, and confirm the verification before reconciliation. The amount must match the invoice total. Reconciliation is transactional and only an open invoice still linked as the Gym's pending invoice can be reconciled. Repeated reconciliation is rejected.

## Service period policy

- A plan change begins at the time external payment is verified. Its end date is calculated from that activation time using the invoice plan's monthly or yearly interval.
- A renewal paid before its proposed renewal boundary keeps that future boundary, preserving continuous service. If the proposed boundary has already passed when payment is verified, the renewal starts at verification time and receives a full monthly or yearly term from then. The owner is not charged for elapsed service days.
- Creating an invoice or submitting a payment claim never activates or extends a subscription. Auto-renew remains disabled.

Rejected payment claims remain attached to the open invoice with their review reason and actor. A corrected claim may be submitted while the invoice remains pending. Voiding an invoice is a separate Superadmin action and preserves the invoice and claim history.
