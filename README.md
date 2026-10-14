This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Seed sample payments

After MongoDB is configured and at least three members have plans priced at two or more whole rupees, run `node scripts/seed-payments.js`. This command is manual and creates one Paid, one Partial, and one Pending sample payment. It skips if its sample records already exist.

## Seed sample attendance

After MongoDB is configured and at least three real members exist, run `node scripts/seed-attendance.js`. This command is manual. It creates records for real members across recent gym days, including two open check-ins today, and skips member/day combinations that already exist.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

## Authentication setup

Set `MONGODB_URI` and `AUTH_SESSION_SECRET` in `.env.local` for local development and in Vercel Project Settings for each deployment environment. Generate a unique session secret with `openssl rand -base64 48`; use a different value in Production, Preview, and Development. `GYM_TIMEZONE` remains optional and defaults to `Asia/Karachi`.

Create a login account from an interactive terminal after configuring the database:

```bash
npm run user:create -- --email you@example.com
```

The password is entered without terminal echo and is stored as a scrypt hash. There is no public sign-up route. All authenticated accounts currently have the same access; roles and account management are not implemented.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
