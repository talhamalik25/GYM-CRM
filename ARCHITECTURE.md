# Fitivo: Architecture

Status: DRAFT v1. Verify against the real codebase. If the code differs, update this file or tell Talha; never silently diverge.

## 1. Stack
- Framework: Next.js 16.4.3 (App Router), React 19.2.8, **JavaScript only, no TypeScript**. React Compiler is enabled.
- Styling: Tailwind CSS v4 (installed 4.3.3; package range `^4`) with `@tailwindcss/postcss` and a local cascade PostCSS plugin. Legacy global CSS and three marketing CSS modules remain; migration is **paused**. See DESIGN_SYSTEM.md.
- Database: MongoDB through Mongoose (installed 9.11.2), using a cached connection from `MONGODB_URI`. Transactional flows require a transaction-capable deployment. Atlas hosting is not established by source code alone.
- Auth: Custom opaque, database-backed sessions (`AuthSession`), HMAC-SHA256 token hashes, seven-day httpOnly cookies, and Node crypto scrypt password hashes. Not NextAuth or JWT. Do not replace it without approval.
- Hosting: Vercel is the documented target; the live deployment and infrastructure were not verified in the 2026-10-31 audit.
- Product family: Fitivo is a product of AKTech Digital Solutions, like Acadivo.

## 2. Multi-tenancy (critical)
Each gym is a tenant. Every tenant-owned document carries `gymId`. Every query, update and delete must be scoped by the `gymId` taken from the **authenticated session on the server**, never from the request body or URL alone.

## 3. Suggested folder structure
Keep the existing structure if different; follow its conventions.
```
app/
  (marketing)/        # public marketing site: home, features, pricing, demo, guide, about, contact, free-trial
  (auth)/             # login, register, forgot password
  (app)/              # authenticated product
    dashboard/
    members/
    memberships/      # plans and assignments
    payments/
    attendance/
    reports/
    settings/
  api/                # route handlers, grouped by resource
components/
  ui/                 # reusable primitives (Button, Input, Card, Modal, Table, Badge)
  marketing/
  app/
lib/
  db.js               # Mongo connection (cached)
  auth.js             # session helpers, requireRole()
  validators/         # input validation per resource
  whatsapp.js         # builds wa.me links
models/               # Mongoose models
config/
  site.js             # site content, contact info
  plans.js            # Fitivo subscription plans (placeholders until confirmed)
  bank.js             # bank details (placeholders until confirmed)
```

## 4. Data models (draft)
All tenant models include `gymId`, `createdAt`, `updatedAt`.

- **Gym**: name, owner, phone, city, status (trial/active/suspended), subscription info
- **User**: gymId, name, email, phone, passwordHash, role (owner|staff|trainer), isActive
- **Member**: gymId, memberCode, name, phone, gender, dob (optional), emergencyContact, status (active|expired|frozen|left), joinedAt, notes, assignedTrainerId (optional)
- **Plan**: gymId, name, durationDays, price, isActive
- **Membership**: gymId, memberId, planId, startDate, endDate, priceAtPurchase, status
- **Payment**: gymId, memberId, membershipId (optional), amount, method (cash|bank|jazzcash|easypaisa|other), reference, receiptNo, receivedBy (userId), paidAt, note, voided (bool, with voidedBy and reason; never hard-delete)
- **Attendance**: gymId, memberId, checkedInAt, markedBy (userId)
- **ReminderLog**: gymId, memberId, type (fee|expiry|inactive), channel (whatsapp), createdBy, createdAt
- **AuditLog**: gymId, userId, action, entity, entityId, before/after summary, createdAt
- **TrialRequest / SubscriptionPayment** (Fitivo's own billing): gym info, plan, amount, screenshot URL, status (pending|approved|rejected), reviewedBy

Dues are **computed** from membership price minus payments, not stored as a separate editable number.

Indexes: `{gymId, ...}` on every collection; unique `{gymId, memberCode}`; `{gymId, endDate}` on memberships; `{gymId, memberId, checkedInAt}` on attendance.

## 5. API conventions
- Route handlers under `app/api/<resource>/`
- Every protected route: authenticate, resolve `gymId` and role from the session, authorize, validate input, then run a scoped query
- Consistent JSON: `{ success: true, data }` or `{ success: false, error: "message" }` with correct HTTP status codes
- Pagination and search via query params for lists
- Validate ObjectIds before querying
- No business logic in components; keep it in route handlers or `lib/`

## 6. Key flows
1. **Sign-up/trial**: request, pending, admin approval, gym account active
2. **Member lifecycle**: add member, assign plan, record payment, attendance, renewal/expiry
3. **Payment**: record, receipt number, dues recalculated, audit entry
4. **Reminder**: pick member from dues/expiring/inactive list, build prefilled WhatsApp link, log reminder, open link
5. **Dashboard**: aggregated queries scoped by `gymId`

## 7. Reminders (v1)
No WhatsApp API. Generate `https://wa.me/<number>?text=<encoded message>` from a template. Normalize Pakistani numbers (03XX to 92 3XX). Log each reminder click.

## 8. Chatbot (marketing site only)
`/api/chat` with a local knowledge base. LLM call only if an API key exists in env; otherwise FAQ keyword fallback. Rate-limited. No key in client code.

## 9. Environment variables
Never hardcode. Keep `.env.example` updated with names only: `MONGODB_URI`, auth secret, optional LLM key, upload storage keys.

## 10. Rules for changing architecture
Any new library, new database, auth change or model rename needs Talha's approval first.
