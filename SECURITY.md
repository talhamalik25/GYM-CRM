# Fitivo: Security Rules

Status: DRAFT v1. Fitivo stores personal data (names, phone numbers) and money records for real businesses. Treat security as a requirement, not polish. Nothing is "secure" until it is tested; do not claim it is.

## 1. Tenant isolation (highest priority)
- Every tenant document has `gymId`.
- `gymId` comes from the server-side session, **never** from request body, query or URL.
- Every find/update/delete includes `gymId` in the filter. Lookups by `_id` alone are forbidden for tenant data.
- Test: a user from Gym A must get 404/403 for any resource of Gym B.

## 2. Authentication
- Passwords hashed with bcrypt (or the project's existing strong hash). Never store or log plain passwords.
- Session/JWT secrets from environment variables, long and random.
- Cookies: httpOnly, secure in production, sameSite lax or stricter.
- Login rate limiting and generic error messages ("Invalid email or password").
- Session expiry; logout actually invalidates the session.
- Do not replace the existing auth system without Talha's approval.

## 3. Authorization (roles)
| Action | Owner | Staff | Trainer |
|---|---|---|---|
| Manage staff users, gym settings, plans | Yes | No | No |
| View reports and audit log | Yes | No | No |
| Add/edit members | Yes | Yes | No |
| Record payments | Yes | Yes | No |
| Void payment | Yes | No | No |
| Mark attendance | Yes | Yes | Yes |
| View assigned members | Yes | Yes | Yes (assigned only) |

- Check role **on the server in every route handler**. Hiding a button in the UI is not security.
- Protect pages and API routes. Middleware alone is not enough; re-check in handlers.

## 4. Input validation
- Validate and sanitize all input on the server (type, length, format, allowed values).
- Validate ObjectIds before querying.
- Use allow-lists for fields on update (no mass assignment of `role`, `gymId`, `passwordHash`, etc.).
- Normalize and validate phone numbers.
- Amounts: positive numbers, sane maximums, stored as numbers, never trusted from the client for totals.
- Protect against NoSQL injection: never pass raw request objects into queries.

## 5. Money and audit
- Payments are never hard-deleted. Use void with reason and who did it.
- Every payment create/void and every member edit writes an AuditLog entry (who, what, when).
- Receipt numbers are generated server-side and unique per gym.
- Dues are computed from records, not typed in manually.

## 6. File uploads (payment screenshots, member photos)
- Allow-list types (jpg, png, webp, pdf where needed) and size limit; check MIME and extension.
- Random server-generated filenames; never trust the original name.
- Store outside the public web root or in private storage; serve only to authorized users.

## 7. Secrets and config
- No secrets in code or in the client bundle. Use environment variables; keep `.env*` out of git. Maintain `.env.example` with names only.
- Bank details and plan prices live in `config/` files, never hard-coded in components.
- LLM or other API keys only used server-side.

## 8. API hygiene
- Rate limit sensitive and public endpoints (login, register, trial request, chatbot, contact form).
- Return minimal data; never return `passwordHash` or internal fields.
- Proper status codes; no stack traces or DB errors in responses.
- CORS: default same-origin; do not open to `*`.
- Public chatbot: cap input length, never expose private data, only answers from its marketing knowledge base.

## 9. Privacy
- Collect only what is needed. Member phone numbers are used for WhatsApp reminders only when staff clicks the button; log that it happened.
- Do not put real member data in screenshots, demos, the marketing site or social posts. Use fake data.
- Owner can export or delete their gym's data on request (post-MVP, but plan for it).

## 10. Dependencies and deployment
- Add dependencies only with approval. Prefer well-maintained packages.
- Run `npm audit` before releases and review high severity issues.
- Production: HTTPS only, separate env vars from development, no debug routes or seed/test endpoints left in production.

## 11. Pre-launch security checklist
- [ ] Cross-tenant access test passed for every resource
- [ ] Role checks verified on every route
- [ ] Rate limiting active on login and public forms
- [ ] No secrets in repo or client bundle
- [ ] Payment void and audit log working
- [ ] Upload restrictions tested
- [ ] Error responses leak nothing
- [ ] Backup plan for the database confirmed
## Public chatbot enquiries

The chatbot renders trusted knowledge as React text, never model-generated HTML. Restored session history is validated and capped at 30 exchanges. Users are asked not to enter secrets or payment details. Optional lead form fields are not persisted to browser storage.

The public lead POST route validates the request origin, limits the JSON body to 4 KiB, validates name/gym name/phone/topic/contact consent, and constructs an allowlisted record. It accepts no gym identity, role or price. Phone is normalized before applying database-backed global and per-phone rate limits. `MarketingLead` holds pre-signup platform enquiries and has no public retrieval endpoint. Consent timestamps come from the server; database failures return generic errors without exposing personal data or credentials. A retention/deletion policy and staff lead-management UI are not introduced by this change.

