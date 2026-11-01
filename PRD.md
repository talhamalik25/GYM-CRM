# Fitivo: Product Requirements Document (PRD)

Status: DRAFT v1. Items marked **ASSUMPTION** are guesses that the owner (Talha) must confirm or correct.
Owner: Talha (AKTech Digital Solutions). Sister product: Acadivo (school ERP).

## 1. What Fitivo is
Fitivo is a web-based gym management system for gyms in Pakistan. It helps a gym owner keep member records, collect fees, spot who is about to leave, and see the day's numbers on a phone, with WhatsApp-based reminders.

**Positioning (one line):** Fee collection and member retention for gyms, with WhatsApp reminders and an owner's daily summary.

## 2. Problem
Gym owners in Pakistan typically run on paper registers, Excel and WhatsApp. Their real pains (to be validated in owner interviews):
- Chasing unpaid fees
- Members quietly stopping attendance, then not renewing
- No trust or visibility on cash handled by staff
- Owner is often not at the gym and cannot see what is happening
- Existing software is in dollars, complex or not built for local payment habits

## 3. Target users
| Role | Description | MVP access |
|---|---|---|
| Gym owner | Owns the gym account, sees everything, manages staff and plans | Yes |
| Front desk / staff | Registers members, marks attendance, records payments | Yes |
| Trainer | Sees assigned members and attendance | Yes (limited) |
| Member | Views own membership, fee status, attendance | Not in MVP (**ASSUMPTION**) |

Customer model: **ASSUMPTION**: multi-tenant SaaS. Many gyms each get their own isolated account, like Acadivo is for schools. Multi-branch support is not in MVP.

## 4. Differentiators (why someone buys this)
1. WhatsApp reminders for fees and expiry (prefilled `wa.me` message, one tap)
2. Owner's daily summary on mobile: money in, check-ins, expiring members, dues
3. Due-fee and defaulter tracking
4. Retention list: members who have not attended in N days
5. Cash accountability: receipts, who recorded what, audit log
6. Local payment methods in one ledger: cash, bank transfer, JazzCash, Easypaisa
7. Easy start: import from Excel/CSV, setup guidance
8. PKR pricing

Not differentiators (do not build for marketing reasons): AI workout plans, native mobile app, diet plans, POS, equipment tracking.

## 5. MVP scope (must have before showing to a real gym)
1. Auth and gym account (owner signs up, creates staff accounts)
2. Members: add, edit, search, status, photo optional, guardian/emergency contact optional
3. Membership plans: name, duration, price
4. Assign/renew membership, with start and expiry dates
5. Payments: record cash/bank/JazzCash/Easypaisa, receipt, partial payment, dues
6. Attendance: manual check-in by staff (search member, one tap)
7. Dashboard (owner daily summary): collections today/this month, check-ins today, expiring in 7 days, total dues
8. Due fees list and expiring-soon list, each with a "Send WhatsApp reminder" button (prefilled link)
9. Inactive members list (no visit in N days, N configurable)
10. Basic reports: collections by period, by payment method, new members
11. Role-based access (owner / staff / trainer)
12. Audit log for payments and edits (owner can view)
13. Marketing site, pricing and trial request (already built or in progress)

## 6. Should have (after MVP)
- CSV/Excel member import
- Trainer assignment and trainer workspace
- Class/session scheduling
- Expense tracking and profit view
- Member portal
- Urdu interface
- Fitivo subscription billing flow (bank transfer + screenshot + manual verification, like Acadivo)

## 7. Optional / later
- QR or card check-in
- Official WhatsApp Business API automation
- SMS reminders
- Multi-branch
- Online payment gateway
- Workout/diet plans
- Mobile app

## 8. Out of scope (do not build unless asked)
AI features, POS, equipment management, social features, e-commerce store.

## 9. Pricing and trials
**ASSUMPTION:** 14-day trial with approval required, then paid monthly/annual plans in PKR via bank transfer with manual verification (same pattern as Acadivo). Actual prices are placeholders until Talha confirms them.

## 10. Success criteria for MVP
- One real gym can run a full month on Fitivo (members, attendance, payments, reminders) without going back to paper
- Owner can see today's collections and dues on a phone in under 10 seconds
- No data from one gym is ever visible to another
- Core flows verified by testing, not assumed

## 11. Open questions (answer these to finalize)
1. Is there a real gym lined up as the first user? By when?
2. Do members need their own login in v1?
3. How do target gyms collect fees today (cash, transfer, wallets)?
4. WhatsApp: is the `wa.me` link approach acceptable for v1?
5. What are the real plan prices?
6. What auth and database does the current code actually use? (Check against PRODUCT_SPEC.md audit.)
