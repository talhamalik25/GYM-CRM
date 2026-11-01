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
  explicit disposable `MONGODB_URI_TEST`; see
  [`tests/INTEGRATION_TESTING.md`](tests/INTEGRATION_TESTING.md).
- `npm run test:unit` explicitly disables database-backed tests.
- `npm run lint` runs ESLint.
- `npm run build` creates a production build.
- `node scripts/browser-smoke.js` checks a local production build with database
  credentials disabled. This does not test authenticated business workflows.

Never point integration tests at `MONGODB_URI` or a production database. The
test helper refuses unmarked database names and undesignated remote hosts.
It also refuses the application's configured host or reused database credentials.

Before enabling integration tests, create a separate test-only MongoDB cluster
or a local replica set with its own empty data directory and a different host or
port from the app database. Create a distinct, least-privilege test database
user; do not reuse the app's username/password. Put the resulting test-only URI
in the ignored `.env.test.local` as `MONGODB_URI_TEST=...` (not in `.env.local`
or source control). The URI must name a database containing `test`, `testing`,
or `disposable`; the harness uses a unique per-run database and drops it after
each suite. Remote clusters also require `MONGODB_TEST_DISPOSABLE=YES` after
you have independently confirmed that the cluster and user are disposable.
Never point the test URI to a production or shared application deployment.

The [2026-10-26 hardening report](docs/SECURITY_HARDENING_2026-10-26.md)
records changes, verification, credential rotation requirements, and launch gates.

## Account utilities

Use `npm run user:create`, `npm run user:promote`, and
`npm run user:reset-password` from an interactive terminal. The commands prompt
for passwords without echoing them. See [`scripts/README.md`](scripts/README.md)
for account bootstrap and seed-script details.
