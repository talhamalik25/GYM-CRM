# Fitivo security hardening and production readiness

Assessment date: 2026-10-26 (Asia/Karachi). Starting revision: `7c7a705`, branch `main`, tracking `origin/main`.

**Readiness: NOT READY for production sign-off.** The code changes and safe checks are complete, but exposed credentials require rotation and database-backed verification is blocked. Nothing was committed, pushed, deployed, or changed in a live database. No credentials were rotated or printed.

## Baseline and scope

- Initial `git status --short --branch` was clean: no staged, unstaged, or untracked work. No stashes were present. Local Git history provides recovery for tracked files; Atlas backup/restore configuration was not accessible or verified. No repository reset or forced checkout was used.
- Inventory: 299 tracked files at baseline, 43 API route files, 35 pages, 18 existing Mongoose model files. App Router pages and HTTP handlers, feature components, `lib` services/rules, models, operational scripts, tests, and deployment configuration remain in their existing structure. One rate-limit model was added.
- Authentication uses database-backed opaque sessions, scrypt passwords, and explicit tenant membership resolution. Business records use Gym and branch scopes. Platform billing and gym-member payments remain separate ledgers.
- Reviewed route entry points, authorization helpers, branch selection, model relationships/index declarations, CRUD filters, aggregation lookups, transactional ledgers, public registration, invitations, expiry cron, settings, exports, account scripts, environment references, dependencies, and import reachability. No application Server Actions or custom middleware/proxy entry points were found; authorization is in handlers and page helpers.
- The reported 162 passing tests/eight successful integration suites were not assumed current. The safe pre-change run produced **132 passed, zero failed, eight skipped**. No current saved result established the reported database-backed baseline. The historical Phase 3B report is retained as dated evidence, not current certification.
- Application and test environment files were inspected only through redacted metadata and internal comparisons. `.env.test.local` uses the same host and credentials as `.env.local`, with a different database name and `MONGODB_TEST_DISPOSABLE=YES`. That is not verified isolation. No integration connection was attempted.

## A. Security improvements

### 1. Invalidate sessions after account security changes

Classification: confirmed session-invalidation weakness, medium severity; exploitation requires an existing session token.

Affected files: `lib/auth.js`, `models/User.js`, `models/AuthSession.js`, `scripts/reset-user-password.js`, `app/api/admin/users/[id]/route.js`, login handler.

Before: resetting a password did not invalidate existing sessions. Deactivation rejected sessions while inactive, but reactivation could revive the old tokens. A separate delete of sessions alone would leave races with concurrent issuance.

After: password reset and deactivation increment the account's `authVersion` in the same atomic account update. Sessions carry the version and session lookup checks the current account version and active status. Login carries the version used for password verification into issuance, preventing a reset between verification and issuance from producing a fresh valid session. Missing versions on existing accounts/sessions are interpreted as zero, preserving compatibility. Cookie name, HttpOnly, SameSite=Strict, Secure in production, host-only path, token entropy, HMAC storage, and seven-day expiration remain intact.

Regression evidence: behavioral tests for stale versions, inactive/missing users, token lookup filters, hashed revocation, stale issuance, random token uniqueness, password verification, and cookie attributes. The authentication tests also pass separately with `NODE_ENV=production`. Actual database reset/reactivation/logout cases were added to the existing profile integration suite but were not run.

### 2. Shared login throttling and uniform password work

Classification: confirmed missing brute-force control, medium severity; timing enumeration is a potential vulnerability, not a demonstrated extraction attack.

Affected files: `lib/loginSecurity.js`, `models/AuthRateLimit.js`, `lib/passwords.js`, login handler.

Before: sign-in attempts were unlimited and absent/inactive accounts skipped scrypt verification.

After: a MongoDB atomic counter permits 20 attempts per normalized email per fixed 15-minute window across application instances. Keys contain an email hash, not the raw address. Duplicate first-insert races retry against the unique `_id`; store errors fail closed. Rejections return 429 with `Retry-After`. Absent/inactive accounts perform dummy scrypt work and receive the same credential error. Password verification itself now enforces the 128-byte ceiling. No IP header is trusted and no authentication dependency was added.

Regression evidence: real login handler success/failure/429 behavior with stubbed persistence, identity normalization, counter collision handling, window rollover, and bounded passwords. Twenty-five concurrent attempts against a real counter were added to the profile integration suite; blocked pending safe database isolation.

Limitations: account throttling can temporarily affect a legitimate user targeted by repeated attempts and does not stop attempts spread across many addresses. A fixed-window boundary can allow adjacent bursts. Verify deployment edge rate limits, especially before enabling public registration. TTL indexes are cleanup; correctness does not depend on timely TTL deletion. Deployment must permit the new collection and provision/verify its expiry index.

### 3. Bound bodies parsed before authentication

Classification: defense in depth against memory/resource exhaustion, medium risk; no production load attack performed.

Affected files: `lib/requestBody.js`, login, registration, invitation acceptance, and account profile handlers.

Before: these routes parsed unrestricted request JSON before authentication.

After: a shared reader limits actual streamed bytes to 16 KiB, including requests with absent or forged Content-Length, and cancels oversized streams. Oversized input receives 413; malformed input receives 400. Existing field validation still runs.

Regression evidence: all four actual handlers reject oversized/malformed input without database work; a streamed body with a forged length is cancelled at the limit. Local browser/runtime checks verify login 413 behavior. Other authenticated JSON routes still depend on hosting request limits plus field validation; this change does not claim a universal application body limit.

### 4. Request-origin and browser-response hardening

Classification: defense in depth, low severity.

Affected files: `lib/auth.js`, `next.config.mjs`.

Before: a missing Origin header was accepted even when browser Fetch Metadata identified a cross-site request. Responses did not declare application-wide framing, sniffing, or referrer policies.

After: explicit `Sec-Fetch-Site: cross-site` writes fail with 403, including when Origin is absent. Existing origin matching and originless non-browser callers remain supported. Responses set `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: same-origin`; the framework identification header is disabled. This reduces clickjacking and external referrer leakage, including invitation URLs. No broad CSP was added that might silently break the existing app.

Regression evidence: valid, foreign, malformed, null, and missing-origin cases, plus local Chrome header and rejection checks. Reverse-proxy origin handling, HTTPS, HSTS, and any production CSP still require deployment verification. Next normalizes loopback IP request URLs to `localhost`; the local smoke uses that canonical origin without relaxing the guard.

### 5. Prevent stale renewal invoices during concurrent subscription changes

Classification: potential concurrency vulnerability/reliability defect, medium severity; inferred from the prior read/write ordering, not reproduced against a live database in this run.

Affected file: `app/api/admin/billing/route.js`.

Before: renewal read the Gym's subscription outside the transaction. The later write checked only the pending invoice ID. A concurrent cancellation or plan grant could leave that ID null while changing the terms, allowing an invoice based on the stale snapshot.

After: renewal acquires the existing Gym transaction lock before reading subscription status, plan price, pending invoice, and dates. Retries reread current terms. Cancelled/inactive/free/pending states are rejected before invoice creation. The existing amount source, manual verification workflow, and atomic invoice/Gym update remain in place.

Regression evidence: a concurrent renewal/cancellation case was added to the existing SaaS integration suite. It asserts either a cancelled subscription with no open invoice or one renewal invoice with cancellation refused. This database case is **not run**. Missing-session checks cover the actual admin billing handler.

### 6. Make unsafe test configuration fail before connection

Classification: confirmed test-environment safety defect, high operational risk.

Affected files: `tests/testDatabaseConfig.js`, its tests, `scripts/run-tests.js`, `package.json`, testing documentation.

Before: a remote disposable flag and a test-named database were sufficient even when application credentials and host were reused. `npm test` automatically loaded that unsafe configuration.

After: preflight compares process and application environment database targets without printing or loading their values into tests. Matching host/port or username/password pairs are refused even with the flag. Common loopback aliases are normalized. `npm run test:unit` explicitly removes database targets from the child environment. Individual integration suites retain the guard. Fresh per-run database names and existing cleanup behavior remain.

Regression evidence: same-host, reused-credential, loopback-alias, separate-port, remote acknowledgment, and generated-name tests pass. Running `npm test` with the actual current configuration exits with the intended redacted safety refusal before starting suites. Different DNS aliases cannot be proven independent by this comparison alone; operator verification remains required.

### 7. Remove raw exception messages from operational logs

Classification: defense in depth, low severity; no claim that every previous exception contained a credential.

Affected files: marketing page, public-registration availability, admin Gym provisioning/user status, subscription/member-history handlers, and member/plan/payment/trainer/attendance error helpers.

Before: several paths logged arbitrary database/driver exception messages.

After: those logs retain fixed operation labels only. Expected user-facing validation and business errors remain. No stack traces or credential-bearing driver errors are intentionally returned. Existing tests, lint, build, and runtime fallback checks pass. Structured safe error-code observability can be added later if required.

### 8. Patch the vulnerable framework dependency

Affected files: `package.json`, `package-lock.json`. Next.js and eslint-config-next changed from 16.3.8 to 16.4.3, staying on major version 16. Existing Node 24.11.1, React 19.2.8, ESLint 9, and compiler dependencies satisfy published peer/engine ranges. No force audit fix or major upgrade was used. Install scripts were disabled. The manifest and lockfile root dependency specifications match.

The initial audit reported one vulnerable direct package, Next.js, with three advisories:

- **Critical:** [GHSA-2464-fhr4-w9xw / CVE-2026-96889](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw), image optimization on glibc Linux. Affected Next 16 versions through 16.4.0; fixed in 16.4.1 or later, with fixed Sharp 0.35.5. This project uses `next/image`, with inspected custom images marked unoptimized and SVG optimization not explicitly enabled. Exploitable deployment reachability was not established; the dependency finding was confirmed and patched.
- **High:** [GHSA-p3m5-59mp-jv5r / CVE-2026-94482](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r), App Router Server Action denial of service. Fixed in 16.4.1. No application Server Actions were found, so the documented prerequisite was not identified in this source.
- **Critical:** [GHSA-673q-mjm6-r5xr](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr), `use cache` functions returning typed arrays. Fixed in 16.4.1. No application `use cache` directives were found; exploit reachability was not demonstrated.

The final npm audit reports **zero known vulnerabilities across all severities**, including development dependencies. The production build and lint pass with the updated packages. This is an advisory result at the assessment date, not a guarantee against undisclosed flaws.

## B. Cleanup summary

The complete baseline file inventory was checked for route conventions and references. Static and literal dynamic imports, package scripts, tests, configuration, documentation, active component entry points, and future/shared UI intent were considered before deletion.

Eight confirmed obsolete files were removed:

- `components/dashboard/dashboard-attendance-data.js`
- `components/dashboard/dashboard-overview.js`
- `components/dashboard/dashboard-widgets.js`
- `components/members/member-profile.js`
- `components/memberships/membership-detail-actions.js`
- `components/memberships/membership-plan-form.js`
- `components/memberships/membership-renewal-form.js`
- `lib/mockData.js`

The dashboard files formed an unreachable legacy component chain. The membership files implemented local-only demo actions; current routes use `membership-record`, `membership-manager`, and API-backed plan management. The old profile exports had no callers. Dead mock/localStorage helper exports were removed from `membersService`, `plansService`, and `paymentsService`, leaving active API calls and shared date helpers intact. The mock module then had no references.

Files moved: zero. Declared dependencies removed: zero. Unrelated folder restructuring: none. Shared body validation was centralized; unrelated stable business logic was not rewritten. Generated Playwright result directories are now ignored. Current local verification logs remain ignored evidence, not tracked application files.

Retained intentionally: all 43 API routes, all 35 pages, the workouts placeholder, all existing models and integration suites, seed/migration/deployment files, environment example, historical operational docs, shared Textarea/Toast/ConfirmDialog components, and the unused security RouteGuard. These shared/security files are not approved deletion targets. No uncertain file was deleted. A future CSS/visual cleanup would need a separate usage review before proposing specific deletions.

## C. Findings and controls retained

### Critical

Confirmed dependency advisories: patched as described above. No application-level critical exploit was demonstrated.

### High

**Confirmed credential exposure in local Git history, unresolved.** The current configured MongoDB URI/password matched historical `.env.example` blob `bef5125bb093686324ec57f24b8b385523d558d7`; history references include `1d987e8` and `217e04a` (2026-10-14). A value-only internal comparison inspected 1,019 reachable historical blobs. This does not prove access by an attacker or current credential validity. Treat the database credential as compromised and rotate it. History rewriting would not substitute for rotation and was not performed.

**Confirmed unsafe test target, blocked.** Application/test host and credentials match. The strengthened preflight now rejects it; no real invoices, subscriptions, indexes, or records were modified by tests.

### Medium

Session invalidation and missing throttling were addressed. Timing enumeration and resource exhaustion received targeted hardening. The renewal race was addressed in source, with database verification pending. Prior raw `.env.local` disclosure reported by the user requires rotating `AUTH_SESSION_SECRET` too; this is reported exposure, not a newly observed Git-history match.

### Low / informational

Origin metadata checks, response headers, and log redaction were strengthened. No confirmed NoSQL injection, mass-assignment privilege escalation, open redirect, SSRF, stored XSS, or cross-tenant API bypass was identified in the inspected source. This is not an exhaustive penetration-test guarantee.

Existing controls retained and checked:

- Tenant identity comes from one active server-loaded GymMembership and active Gym, never a client gymId. Ambiguous memberships fail closed. Roles are checked server-side, and tenant filters combine trusted scope with request filters using `$and`.
- Business APIs use branch scopes and tenant-owned related-record lookups. Staff cannot select another branch; consolidated access is restricted to entitled owners/read endpoints. Trainer workspace selects the current trainer profile by authenticated account email and returns assigned members only. Organization settings/billing intentionally use organization scope.
- All 56 protected HTTP handlers reject missing sessions in executable tests before any MongoDB connection. Shared guard tests exercise platform-role rejection, forged tenant selection, unauthorized branches, trainer restrictions, suspension, and expiry with stubbed persistence. Real two-Gym database behavior remains blocked.
- Superadmin endpoints guard provisioning, owner assignment, user status, settings, plans, trials, invoices, reconciliation, and cancellation. Tenant staff cannot grant platform roles. Creation validators allowlist fields; settings/profile updates cannot change subscription dates or account roles.
- Member-payment transactions retain fingerprints, idempotency keys, tenant checks, version locks, amount/balance validation, and receipt uniqueness. SaaS reconciliation requires a Superadmin, independent-verification acknowledgment, exact server-stored amount, an open invoice, and a matching pending subscription. Invoice and Gym updates are transactional. An owner claim does not mark an invoice paid.
- Actual owner plan selection creates a **review request**, not an immediate invoice; Superadmin approval issues the invoice. This existing workflow was preserved. New provisioning can grant an explicit trial while an invoice remains open; that trial is distinct from paid activation.
- Capacity changes serialize on Gym locks and count server-side usage. Trial identity claims and unique indexes prevent reuse of the same identity. Creating entirely new identities is not equivalent to identity verification and still needs abuse controls when public registration is enabled.
- Date-based access checks reject expired subscriptions without depending on cron. Legacy gyms without required SaaS access remain intentionally compatible; deploying a blanket paywall was not authorized. Cron uses a required bearer secret; GET and POST keep their distinct existing scopes.
- Exports are tenant/branch-scoped cursor streams with CSV formula escaping and explicit fields. Exports are not globally rate/row limited. Large reports, dues queries, and some admin listings remain potential resource pressure points; no production load test was performed.
- Password hashes remain excluded by default; account serializers expose explicit fields. Images supplied by users are browser-rendered, not arbitrary application URL fetches. No credential-bearing `NEXT_PUBLIC_` usage was found; current public variables are support contact configuration.

## D. Verification

- **Passed:** final `npm run test:unit`: **153 reported tests, 145 passed, zero failed, eight skipped**. Thirteen additional database-free tests were added; one exercises all 56 protected HTTP handlers. An existing source-contract assertion was updated to require the stronger version-aware session issuance, not relaxed.
- **Passed:** authentication regression file under `NODE_ENV=production`: **10 passed**, zero failed. These overlap the 145 and are not added to that total.
- **Blocked as intended:** `npm test` refuses the current shared application/test target at preflight. The full database-backed suite cannot be claimed passing.
- **Not run:** all eight integration suites: admin Gym details, admin overview, owner registration, payment ledger, SaaS entitlements, staff invitations, tenant isolation, and user profile. New real counter/session/race cases are included in those existing suites.
- **Passed:** ESLint, with zero reported errors/warnings.
- **Passed:** production Next build with database/cron credentials explicitly disabled in its child environment. Initial sandbox execution failed only to fetch the existing Google Inter font; the network-enabled build passed. External font access remains a build-time dependency.
- **Passed:** final npm advisory audit: zero vulnerabilities. Manifest/lockfile dependency checks passed. `npm ls` reported three local optional WASM artifacts as extraneous; `npm prune --ignore-scripts` reported the installation up to date. No declared dependency was removed based on that label.
- **Passed:** static/literal dynamic local import resolution scan, zero broken imports; production compilation provides an additional import check.
- **Passed:** current tracked files and 58 public build assets contained no exact match to the known configured MongoDB URI/password or session secret. This is a scoped known-secret scan, not proof that no other secret exists. Only `.env.example` is tracked; live environment files remain ignored.
- **Passed:** database-free headless Chrome smoke, seven groups: landing fallback/headers; login form; four protected page redirects; three anonymous business/billing API checks; foreign-origin and oversized-login rejection; sessionless logout; no page runtime errors. The initial IP-origin smoke assertion exposed Next's localhost normalization; the harness now uses its canonical localhost origin, with no authorization change.
- **Passed:** `git diff --check` at final review.
- **Not run / not verified:** successful browser login/logout with a persisted session, real owner/Superadmin workflows, runtime tenant/branch isolation, billing reconciliation/expiry/capacity concurrency, deployed collection indexes, Atlas roles/network access/backups, Vercel environment/cron/proxy configuration, and production traffic behavior.

## E. Production readiness gates

The result is **not ready for launch sign-off**, despite passing the build and safe tests. Required next steps:

1. Rotate the exposed MongoDB application username/password credential; update every deployment that uses it and revoke the old credential. Replace test credentials with a separate least-privilege account on an independently verified test-only deployment. Do not merely rename the database or set the disposable flag.
2. Rotate `AUTH_SESSION_SECRET` in every application environment affected by the reported disclosure. Expect existing sessions to become invalid; coordinate that operationally. No other configured secret categories were found in the inspected local files, but any credentials in the earlier disclosure beyond those files also need review.
3. Provision a dedicated disposable replica set and verify its host, credentials, access boundaries, and generated-database cleanup. Run all eight integration suites with no skips, including the new session/counter/billing race cases. Then run authenticated browser scenarios using synthetic accounts.
4. Deploy the updated lockfile and verify the application DB role can use the new AuthRateLimit collection. Confirm required uniqueness/TTL indexes, transaction support, backup recovery, and any legacy Gym/branch data migration gates. No migration was run here.
5. Verify HTTPS/cookies, canonical origins behind the actual proxy, hosting request/time/concurrency limits, registration abuse protection, and the intended cron secrets/schedule. No Vercel configuration was changed. Keep public registration disabled until its operational checks pass.

## F. Remaining risks and decisions

- Credential rotation and historical exposure handling remain the highest-priority operator tasks. Do not print the URI, password, or session secret while doing them.
- Database-backed and authenticated-browser assertions remain unverified. Stubbed guard tests are not proof of deployed MongoDB transaction/index behavior.
- This adds per-account login limits, not distributed global/IP abuse protection, registration identity verification, or universal authenticated-request limits. Configure the hosting boundary accordingly before production sign-off.
- Local backups of tracked source are available through Git history; recovery of Atlas data and external configuration remains unverified.
- No uncertain deletion, major dependency migration, auth-system replacement, billing gateway, automatic reconciliation, commit, push, or deployment was performed.

## Appendix: API inventory at final review

Source review covered all routes below. Anonymous rejection was executed for every protected handler; database-backed role/tenant scenarios remain subject to the stated verification limits.

- `GET/PATCH /api/account/profile` — authenticated active Gym Owner; account-only fields.
- `GET/POST /api/admin/billing` — platform Superadmin.
- `POST /api/admin/gym-owners` — platform Superadmin.
- `GET/PATCH /api/admin/gyms/[id]` — platform Superadmin.
- `GET/POST /api/admin/gyms` — platform Superadmin.
- `GET /api/admin/overview` — platform Superadmin.
- `PATCH /api/admin/users/[id]` — platform Superadmin.
- `GET/POST /api/admin/users` — platform Superadmin.
- `POST /api/attendance/[id]/check-out` — owner/admin, trusted Gym/branch scope and applicable entitlements.
- `POST /api/attendance/check-in` — owner/admin, trusted Gym/branch scope and applicable entitlements.
- `GET /api/attendance` — owner/admin, trusted Gym/branch scope and applicable entitlements.
- `GET /api/attendance/summary` — owner/admin, trusted Gym/branch scope and applicable entitlements.
- `POST /api/auth/login` — public credential/token validation / origin check.
- `POST /api/auth/logout` — presented session revocation / origin check.
- `POST /api/auth/register` — public credential/token validation / origin check.
- `GET/POST /api/branches` — owner/admin/trainer selection; owner-only mutation.
- `POST/GET /api/cron/saas-expiry` — configured cron bearer secret.
- `GET /api/dashboard/owner` — owner/admin, trusted Gym/branch scope and applicable entitlements.
- `GET /api/exports` — owner/admin, trusted Gym/branch scope and applicable entitlements.
- `GET/POST /api/gym/billing` — Gym Owner; inactive subscription recovery; suspended Gym GET only.
- `GET /api/gym/entitlements` — active tenant membership; inactive SaaS permitted.
- `GET/PATCH /api/gym/settings` — Gym Owner, trusted Gym scope.
- `GET/PATCH /api/members/[id]` — owner/admin, trusted Gym/branch scope and applicable entitlements.
- `GET /api/members/[id]/subscriptions` — owner/admin, trusted Gym/branch scope and applicable entitlements.
- `GET/POST /api/members` — owner/admin, trusted Gym/branch scope and applicable entitlements.
- `GET /api/payment-reports` — owner/admin, trusted Gym/branch scope and applicable entitlements.
- `GET /api/payments/[id]` — owner/admin, trusted Gym/branch scope and applicable entitlements.
- `GET /api/payments/dues` — owner/admin, trusted Gym/branch scope and applicable entitlements.
- `POST/GET /api/payments` — owner/admin, trusted Gym/branch scope and applicable entitlements.
- `GET /api/payments/summary` — owner/admin, trusted Gym/branch scope and applicable entitlements.
- `GET/PATCH /api/plans/[id]` — owner/admin, trusted Gym/branch scope and applicable entitlements.
- `GET/POST /api/plans` — owner/admin, trusted Gym/branch scope and applicable entitlements.
- `GET /api/reports` — owner/admin, trusted Gym/branch scope and applicable entitlements.
- `POST /api/staff/invitations/accept` — public credential/token validation / origin check.
- `GET/POST /api/staff/invitations` — Gym Owner, trusted Gym scope.
- `PATCH /api/staff/manage` — Gym Owner, trusted Gym scope.
- `POST /api/subscriptions/[id]/payments` — owner/admin, trusted Gym/branch scope and applicable entitlements.
- `POST /api/subscriptions/[id]/renew` — owner/admin, trusted Gym/branch scope and applicable entitlements.
- `GET/PATCH /api/subscriptions/[id]` — owner/admin, trusted Gym/branch scope and applicable entitlements.
- `GET/POST /api/subscriptions` — owner/admin, trusted Gym/branch scope and applicable entitlements.
- `GET /api/trainer/workspace` — trainer, assigned profile and branch.
- `GET/PATCH /api/trainers/[id]` — owner/admin, trusted Gym/branch scope and applicable entitlements.
- `GET/POST /api/trainers` — owner/admin, trusted Gym/branch scope and applicable entitlements.
