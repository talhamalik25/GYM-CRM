# Seed sample plans

The seed script runs only when you explicitly start it. Set `MONGODB_URI` in `.env.local`, then run from the project root:

```sh
node --experimental-default-type=module --env-file=.env.local scripts/seed-plans.js
```

It inserts Basic, Standard, and Premium only when the plans collection is empty. It does not run during development or build automatically.

## Seed sample members

The member seed looks up active plan documents, so create or seed plans first. Then run from the project root:

```sh
node --experimental-default-type=module --env-file=.env.local scripts/seed-members.js
```

It inserts three sample members only when the members collection is empty. It does not run automatically.
