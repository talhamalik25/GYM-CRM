# Seed sample plans

Seed scripts run only when explicitly started. Set `MONGODB_URI` and `GYM_ID` in `.env.local`; `GYM_ID` must identify an existing active gym. The scripts scope their reads and writes to that gym and refuse to run while any legacy gym-owned record has no `gymId`.

Run from the project root:

```sh
node --experimental-default-type=module --env-file=.env.local scripts/seed-plans.js
```

It inserts Basic, Standard, and Premium only when the plans collection is empty. It does not run during development or build automatically.

## Seed sample members

The member seed looks up active plans in `GYM_ID`, so create or seed plans first. Then run from the project root:

```sh
node --experimental-default-type=module --env-file=.env.local scripts/seed-members.js
```

It inserts three sample members only when the members collection is empty. It does not run automatically.

## Create and bootstrap user accounts

Set `MONGODB_URI` and `AUTH_SESSION_SECRET` in `.env.local`. Create the first account with a hidden password prompt:

```sh
npm run user:create -- --email owner@example.com
```

When the users collection is empty, that first account becomes the superadmin. Later CLI-created accounts are staff accounts.

For an existing installation, promote one active account only when no superadmin exists:

```sh
npm run user:promote -- --email owner@example.com
```

After a superadmin can sign in, use **User accounts** in the account menu to create staff accounts. Promotion does not reset passwords or modify other accounts.

If an existing account cannot sign in, reset its password from the project root with a hidden prompt:

```sh
npm run user:reset-password -- --email owner@example.com
```

The command updates only an existing active account. It does not create or reactivate accounts.
