# Fitivo: Complete Product Detail

One-page source of truth for anyone (human or AI agent) who needs to understand what we are building. Details live in the linked files. Items marked **ASSUMPTION** are unconfirmed.

## What we are building
**Fitivo** is a web-based gym management system for gyms in Pakistan, built by AKTech Digital Solutions (sister product of Acadivo, a school ERP). It is a multi-tenant SaaS (**ASSUMPTION**): each gym gets its own isolated account.

**Core promise:** Gym owners collect fees more reliably, notice members before they quit, see the day's numbers on their phone, and send WhatsApp reminders in one tap.

## Who it is for
Gym owners and their staff and trainers. First target: small and mid-size gyms in Karachi (**ASSUMPTION**; the first real gym is still to be confirmed).

## What makes it different
1. WhatsApp reminders (prefilled links) for fees and expiry
2. Owner's daily summary (collections, check-ins, expiring, dues)
3. Dues and defaulter tracking
4. Inactive-member (retention) list
5. Cash accountability: receipts, void instead of delete, audit log
6. Local payments in one ledger: cash, bank, JazzCash, Easypaisa
7. Easy start (import, guidance) and PKR pricing

## Modules (MVP)
Auth and gym account, Members, Plans and memberships, Payments and receipts, Attendance, Owner dashboard, Dues / expiring / inactive lists with WhatsApp links, Basic reports, Roles and audit log, Marketing site with trial request and bank-transfer subscription flow, Marketing chatbot.

Full lists: **PRD.md** (scope), **ARCHITECTURE.md** (stack, models, flows).

## Not building (for now)
AI features, native mobile app, diet/workout plans, POS, equipment tracking, online payment gateway, multi-branch, official WhatsApp API, member portal (later).

## Tech summary
Next.js App Router, JavaScript only, MongoDB with Mongoose, Tailwind for all new styling, Vercel. Auth system: verify what the code uses. Details in **ARCHITECTURE.md**.

## Design summary
Light, premium SaaS look, indigo #4F46E5, mobile-first, reusable components. Details in **DESIGN_SYSTEM.md**. Styling rule: Tailwind only for new work; the old-CSS-to-Tailwind migration is **paused** until the product is complete.

## Security summary
Strict tenant isolation by `gymId` from the session, server-side role checks, validated input, no hard-deleting money records, audit log, secrets in env. Details and pre-launch checklist in **SECURITY.md**.

## How AI agents must work
One task at a time, small commits, build and test each step, never invent data, never add libraries or change auth/models without approval. The full "never do" list is in **AGENTS.md**.

## Business context
- Brand: Fitivo (own logo, not made yet), by AKTech Digital Solutions
- Paid subscription flow (**ASSUMPTION**): choose plan, bank transfer, upload screenshot, manual verification within 24 hours, then activation. Bank details and prices are placeholders in `config/` until confirmed.
- Trial: 14 days, approval required (**ASSUMPTION**)

## Current status
Unknown until the code audit (PRODUCT_SPEC.md) is completed. Do not assume any feature is finished or secure without evidence.

## Open decisions
See "Open questions" in **PRD.md**.

## File index
| File | Purpose |
|---|---|
| PRD.md | What and why, scope, MVP |
| ARCHITECTURE.md | How it is built |
| DESIGN_SYSTEM.md | How it looks |
| SECURITY.md | How it stays safe |
| AGENTS.md | What agents must and must not do |
| PRODUCT_DETAIL.md | This overview |
