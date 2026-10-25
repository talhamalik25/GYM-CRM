# Fitivo

Fitivo is a multi-tenant gym management SaaS built with Next.js App Router,
React, MongoDB, and Mongoose. It includes Superadmin and Gym workspaces for
members, memberships, attendance, trainers, staff, reports, branches, and
subscription billing. Gym member payments and Fitivo SaaS invoices are separate
ledgers; SaaS invoice payment is verified and reconciled by an authorized
Superadmin.

## Development

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and configure `MONGODB_URI` and
   `AUTH_SESSION_SECRET` for a local development database.
3. Use a transaction-capable MongoDB replica set for payment, subscription, and
   registration flows. See the operational guides in `docs/` before enabling
   public registration or configuring expiry jobs.
4. Start the app with `npm run dev`.

Public registration is opt-in and disabled in `.env.example`. It requires an
active trial plan and the settings described in
[`PUBLIC_TRIAL_ONBOARDING.md`](docs/PUBLIC_TRIAL_ONBOARDING.md).

## Project layout

- `app/` contains public pages, authenticated App Router pages, and API route
  handlers.
- `components/` contains shared UI and feature components.
- `lib/` contains authentication, tenant authorization, business rules, and
  application services.
- `models/` contains Mongoose schemas.
- `scripts/` contains explicitly invoked account and data utilities.
- `tests/` contains unit and MongoDB integration tests.
- `docs/` contains onboarding, security, billing, migration, and operations
  guides.

## Checks

- `npm test` runs the Node test suite. MongoDB integration suites require an
  explicit disposable `MONGODB_TEST_URI`; see
  [`tests/INTEGRATION_TESTING.md`](tests/INTEGRATION_TESTING.md).
- `npm run lint` runs ESLint.
- `npm run build` creates a production build.

Never point integration tests at `MONGODB_URI` or a production database. The
test helper refuses unmarked database names and undesignated remote hosts.

## Account utilities

Use `npm run user:create`, `npm run user:promote`, and
`npm run user:reset-password` from an interactive terminal. The commands prompt
for passwords without echoing them. See [`scripts/README.md`](scripts/README.md)
for account bootstrap and seed-script details.
