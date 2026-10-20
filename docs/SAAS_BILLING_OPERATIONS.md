# SaaS billing operations

Fitivo SaaS invoices are separate from Gym member invoices and payments. SaaS
payments are not processed automatically. A platform administrator must verify
the external payment and reconcile its open invoice with a payment reference.
Reconciliation only accepts an open invoice that is still the selected Gym's
pending invoice and matches its plan, amount, currency, and billing interval.
Repeated reconciliation of a paid or voided invoice is rejected.

## Subscription access policy

- An unassigned legacy Gym remains accessible until a SaaS plan is assigned.
- Trials grant tenant access from `trialStartedAt` up to, but not including,
  `trialEndsAt`.
- Paid `active` terms grant access from `periodStart` up to, but not including,
  `periodEnd`. Missing or invalid boundaries fail closed.
- `past_due`, `expired`, and `cancelled` subscriptions do not grant Gym tenant
  access. Cancellation is immediate. Suspended Gyms remain inaccessible.
- Owners can still read their Gym's Fitivo billing page when the SaaS status is
  restricted or the Gym is suspended. That endpoint exposes billing details
  only; it does not restore tenant access. Superadmins retain platform billing
  access to resolve the account.
- Voiding an unpaid invoice does not activate a subscription. An administrator
  must issue a valid invoice or assign a new plan. There is no automated charge.

## Expiry processing schedule

The protected endpoint `POST /api/cron/saas-expiry` marks ended trials and paid
terms as `expired`. It is idempotent: each run only updates `trialing` or
`active` records whose end boundary is at or before the processing time (or has
no end boundary). It does not change invoices, mark payments received, or delete
records. Tenant access checks enforce the same boundaries immediately, even
before the next scheduled run.

Configure a random secret of at least 32 bytes as `SAAS_EXPIRY_CRON_SECRET` in
the server environment. Schedule a deployment-side daily POST, for example via
the host's cron/scheduled-job facility, with:

```http
POST /api/cron/saas-expiry
Authorization: Bearer <SAAS_EXPIRY_CRON_SECRET>
```

The endpoint returns `processed`, the number of subscription records changed.
Do not expose the secret in browser code or client-visible configuration. No
application scheduler is present, so this deployment task is required for
persistent status updates and reporting; access enforcement does not depend on
the task running.
