# Fitivo final alignment check

Audit date: 2026-11-01 (Asia/Karachi). This re-runs the A1 code/document audit and compares findings with the original 2026-10-31 `ALIGNMENT_REPORT.md`. Source review, unit tests, build/lint checks and route/model inventories are evidence; this is not a penetration test or launch approval. No database values or secrets were printed. The unreferenced `/dev/ui` preview page was removed as explicitly requested.

## Comparison with the original A1 report

The original report materially predates A3 and subsequent product work. Its C01–C04 statements are no longer accurate as written:

- **C01, client-controlled membership price — Fail-fixed in current code/tests.** Subscription creation and renewal load the active plan by server tenant scope and use its database price. A mismatching submitted agreedPrice is rejected. Unit test `subscription create and renewal cannot override the database price` passes. Database-backed end-to-end persistence was not exercised.
- **C02, owner-only plans/reports — Fail-fixed in current code/tests.** Plan mutation and reports require `gym_owner`; member payment void is also owner-only. The role matrix test passes for the covered handlers. A complete per-route live role matrix remains unverified.
- **C03, member-payment void/audit — Fail-fixed in current code/tests.** Payment records now have actor and void metadata; void preserves the record, is owner-only, and writes an audit entry. Member create/edit and payment create/void audit actions are defined and written. Mock/unit tests pass; no isolated MongoDB transaction run was possible. An owner audit-log viewer/API is still missing (Important MVP gap).
- **C04, login/register throttling — Fail-fixed in current code/tests.** Shared database-backed global and identity buckets are wired to login and registration; public invitation acceptance has a per-token limiter. Unit tests cover the limiter and login behavior. Live contention/load testing was not run. Contact and free-trial pages prepare local email drafts rather than submit public requests.

The original I02 Basic dashboard entitlement mismatch is **not established as fixed**. The owner dashboard's analytics component still requests `/api/reports?dashboard=1`; the current feature gate selects `basicReports` only for `basic=1` and otherwise selects `advancedAnalytics`. Since the Basic catalog does not include advanced analytics, source suggests that dashboard charts can be denied to Basic tenants. The separate `/api/dashboard/owner` endpoint has scoped real summary queries, but this does not prove the chart request is entitled. There was no Basic-plan database/browser session to verify. Keep this as Important and test/fix in the relevant dashboard task.

The original I04 trainer check-in gap has changed: attendance check-in/out handlers now accept the intended owner/staff/trainer roles. Assignment boundaries and full real-data behavior are not verified for every route. I09–I10 remain broadly valid as design/legacy styling caveats, but line counts and current pages changed. I11 is materially different: the current unit suite has four failures, eight database suites skipped, and full `npm test` refuses to start because its database safety guard detects application database host/credentials reused for tests. See Verification.

## Findings by severity

Severity: **Critical** = security or financial-integrity exposure; **Important** = missing MVP behavior or launch-quality issue; **Minor** = documentation/maintenance mismatch. “Not verified” is not a claim that a vulnerability exists or that a control works.

### Critical

No new directly exploitable critical flaw was established by this source audit. The pre-launch security checklist is **not complete** because critical assurance work (every-resource isolation, all-route roles, secrets/bundle and operational controls) is not verified. Do not interpret this section as launch clearance.

### Important

- **I01 — Tenant isolation and role coverage lack full integration evidence.** Static route handlers generally derive gym scope and roles through server-session helpers; unit tests cover representative foreign IDs/forged gym query rejection. The integration suite cannot safely run: `npm test` exits before tests with `Test database refused: application database host or credentials are reused. Configure an independently verified isolated test deployment and separate credentials.` The tenant isolation unit/mock suite also fails on the trainer detail lookup because its mock does not satisfy the handler's new gym-scoped lookup. No cross-gym database test result is claimed.
- **I02 — A3 `$where` zero-occurrence requirement remains unmet.** Four source occurrences remain. `app/api/gym/billing/route.js:70` and `app/api/admin/billing/route.js:317,343` set Mongoose document `.$where` to that invoice's already persisted `gymId` before `save()` (scoped optimistic save guard). `app/api/admin/gym-owners/route.js:44` sets the prior membership's `.$where` to the selected Gym's server-resolved ID before save. These values are server-derived, not request strings; however, they violate the prior A3 “remove all `$where`” acceptance. No `$function`, `$accumulator`, mapReduce, `eval()` or `new Function` source usage was found. This final audit did not change those security-sensitive handlers.
- **I03 — Retention and WhatsApp reminder MVP is absent.** There is no configurable no-visit-in-N-days list, member fee/expiry reminder link, reminder audit/log, or persisted click record. The dues and expiry data alone do not meet PRD differentiators.
- **I04 — Owner audit-log access is absent.** AuditLog writes exist, but no owner-facing query/API is present for the PRD promise that the owner can view the log.
- **I05 — Member lifecycle fields are incomplete.** Member code, optional photo storage, emergency contact, and explicit frozen/left lifecycle are absent. Photo upload security has no server upload implementation to test.
- **I06 — Trial request and payment upload remain incomplete and contract differs.** Marketing free-trial/contact use mailto drafts; registration creates an immediate seven-day trial when enabled. Marketing promises an approval-based fourteen-day trial. Screenshot choice on `/payment` is a local preview with submission disabled; no request queue or private upload backend exists. PRD §6 defers Fitivo billing while PRODUCT_DETAIL places it in MVP. Commercial scope and duration need owner decision before accepting real requests/transfers.
- **I07 — Operational prices are still unconfirmed.** `config/plans.js` keeps operational initialization defaults of PKR 2999/5999/9999; public quote values remain placeholders. No pricing error is claimed, but the owner must confirm these amounts before production billing.
- **I08 — Professional UI/design-system drift remains.** `/payment`, `/demo`, `/privacy`, `/terms`, `/workouts` expose provisional or unfinished states. The marketing style still includes three CSS modules and serif accents. Existing global CSS remains 9,278 lines. The design document explicitly pauses mass migration and gives existing exact values precedence, so this audit did not restyle unrelated pages. Authenticated screens, contrast, and screen-reader behavior were not comprehensively inspected.
- **I09 — Seed and operational safety need manual controls.** Existing seed scripts can write records to a selected active gym; their behavior was not run. Require a confirmed disposable database and synthetic fixtures before any use. Backup/restore, production HTTPS, cron secret configuration and deployment separation are not source-verifiable.
- **I10 — Current unit run has three failing test cases (four failures counted including the nested trainer subtest).** Exact causes are listed below. One is a stale test assumption; the trainer failure is a mock mismatch; and the tenant-source assertion expects an older helper name. These need a separate test/security repair task; no application code was changed here beyond removing the preview route.
- **I11 — Basic dashboard analytics may request a feature it does not have.** The dashboard query uses `dashboard=1`, while the server gate uses `basic=1` to select the Basic Reports entitlement and otherwise selects advanced analytics. The dashboard summary endpoint is separate and scoped, but charts may still fail for Basic. No Basic subscription was available to reproduce this.

### Minor

- **M01 — The A3 `$where` grep would not pass.** Search returned the three routes/four assignments listed in I02 (plus intentional injection test strings). The task here asked for final alignment, not reopening those security changes.
- **M02 — Architecture suggestions are not exact folder layout.** Current implementation uses `(dashboard)` rather than suggested `(app)`, resource-specific component folders, `config/`, and `lib/*Rules.js`; ARCHITECTURE.md says to preserve existing conventions. No mass route rename is warranted.
- **M03 — API response envelope differs from the draft.** Common errors are `{success:false,error:{message,fields?,context?}}` rather than a string error. Existing clients expect this shape.
- **M04 — Shared design tokens and legacy styles are mixed.** Current token values and older global rules coexist with Tailwind. The paused migration policy is respected; changed screens should continue to use Tailwind and shared primitives.

## Comparison with each governing document

- **AGENTS.md:** JavaScript, App Router, existing auth, database and package stack are in place. No application behavior, API route, model or data was changed by this audit. The requested preview route was removed only after confirming no references. Current failures mean the definition of done is not met. Keep future fixes scoped and do not resume the paused CSS migration.
- **PRD.md:** members, plans, subscriptions, payments, attendance, owner dashboard, reports and staff roles have substantial code. Audit writes and payment void now exist. MVP gaps are reminders/retention, audit-log viewing, member lifecycle/contact/photo fields, and a real approved trial-request flow. Several later-scope items (branches, SaaS billing, trainer workspace) already exist; preserve them, but do not treat them as MVP blockers by themselves.
- **ARCHITECTURE.md:** installed stack and config organization now match the documented current stack. Folder layout is a permitted existing convention. Models are listed in PRODUCT_SPEC.md; `Subscription` implements purchased membership, `GymMembership` grants tenant access, and `PlatformInvoice` implements SaaS billing. Existing response contract differs from the proposed string error format. `$where` document-save guards remain a prior security-task acceptance gap.
- **DESIGN_SYSTEM.md:** shared primitives, Tailwind v4, light/indigo direction and Inter are present. Existing raw/global CSS and three marketing modules remain under the explicit migration pause; arbitrary legacy values and serif marketing accents are differences to track, not a reason to mass-refactor. `/dev/ui` is removed. Unfinished placeholders and authenticated accessibility/contrast require later review.
- **SECURITY.md:** source has session-derived tenant context, role checks, input/ObjectId validation, rate-limit buckets, payment void metadata and audit writes. The checklist below is not fully verified. No live cross-gym integration run, comprehensive secret/bundle scan, production error-leak review, upload backend test, or database backup confirmation was possible. Four `.$where` save-guard assignments remain and fail the literal previous A3 zero-use requirement, although their values are server-derived.
- **PRODUCT_DETAIL.md:** marketing and product direction generally align, but the approval-based trial and payment-screenshot workflow are not end-to-end. It also conflicts with PRD on whether Fitivo subscription billing is MVP. No scope decision was inferred.

## SECURITY.md pre-launch checklist

| Checklist item | Status | Evidence and limits |
|---|---|---|
| Cross-tenant access test passed for every resource | **Not verified** | Mock/unit tests cover representative protected resource IDs. Full isolated MongoDB integration cannot run due the database safety refusal; trainer lookup mock currently fails. |
| Role checks verified on every route | **Not verified** | Auth middleware/unit checks cover all 57 protected handlers for missing sessions and several role matrices pass. Not every role/resource combination was tested; current full route test failures are documented. |
| Rate limiting active on login and public forms | **Pass** | Login and registration use shared global + identity rate-limit buckets; invitation acceptance is token-limited. Unit tests cover limiter behavior. Contact/trial are local email drafts, not server submission forms; no live load test. |
| No secrets in repo or client bundle | **Not verified** | `.env*` is ignored and `.env.example` is tracked with names/blank values. No comprehensive current git-history or built-client secret scan was run; runtime secrets/deployment settings were not inspected. |
| Payment void and audit log working | **Pass** | Passing unit/mock test verifies receipt preservation, owner void, actor audit, totals exclusion, and replay rejection. DB transaction persistence not verified. |
| Upload restrictions tested | **Not verified** | Payment page preview validates local file type/size, but there is no server upload/store/serve path to exercise against SECURITY.md requirements. |
| Error responses leak nothing | **Not verified** | Common route handlers return generic errors, but no exhaustive injected DB-error/production response review was performed. |
| Backup plan for the database confirmed | **Not verified** | No owner/operator confirmation or restore drill evidence exists in this workspace. |

`Fail-fixed` is not used in the checklist because the table records current launch evidence. The original A1 Critical items that were subsequently fixed are identified above as “Fail-fixed in current code/tests.”

## Verification run for this audit

- `rg --files app` / PowerShell route inventory: 43 source page routes after removing `/dev/ui`; 43 API route files; 19 persisted models plus `models/saasSchemas.js` shared schemas. `PRODUCT_SPEC.md` enumerates routes, methods, purpose and protected actor. Source handler exports should be re-counted after future route edits.
- Special-query scan across source (excluding dependencies): four `.$where` persistence guards in three files; no `$function`, `$accumulator`, mapReduce, `eval()` or `new Function` usage. Injection strings in tests are expected fixtures.
- Reference scan found no executable references to `/dev/ui`; no debug API route was found. Seed scripts are operational scripts, not routes, and were preserved.
- `npm run test:unit`: 227 total, 215 passed, 4 failures reported (3 failing cases including one nested subtest), 8 skipped. Failed cases:
  1. `tests/gymOwnerRegistration.test.js:149`: expects `requirePublicGymOperationalPage()` with no arguments; the report page now correctly passes `{ allowedRoles: ["gym_owner"] }`. This is a stale source assertion; the actual guard remains present.
  2. `tests/securityHardening.test.js:99` GET `trainers/[id]`: expected foreign-tenant 404, got 500 after ~10 seconds. Cause: the mocked trainer query does not match the new gym-scoped query. The production gym filter must remain; update the mock in a security-fix task.
  3. `tests/tenantFoundation.test.js:115`: assertion expects `requireApiUser()` in `app/api/exports/route.js`; the route instead calls `requireRole(request, "gym_owner")` and `tenantFilter(request)`. This is a stale helper-name assertion; it should test authorization behavior and tenant filter semantics rather than require a specific helper spelling.
- `npm test`: **Fail before test execution** with exact guard message: `Test database refused: application database host or credentials are reused. Configure an independently verified isolated test deployment and separate credentials.` No database credentials were printed or altered.
- `npm run build`: **Pass**. Next.js 16.4.3 compiled and generated all 68 static pages; route table contains no `/dev/ui`.
- `npm run lint`: **Pass** (ESLint exited 0 with no findings).
- Not run: live DB queries/mutations, successful login, real cross-tenant database checks, every role matrix against real records, uploads, email, production deployment, rate-limit load, backup/restore, or accessibility certification.

## Recommended order of fixes

1. Set up a separately verified disposable MongoDB test deployment and separate test credentials; then repair the four unit failures without removing tenant filters or weakening page/route authorization. Re-run targeted and full suites.
2. Complete every-resource two-gym read/write isolation and owner/staff/trainer role matrix tests; specifically correct the trainer mock to match the gym-scoped lookup and resolve all remaining source-scope assertions.
3. Close the A3 `$where` acceptance gap by replacing the three `.$where` document save guards with supported explicit optimistic filters or scoped atomic updates, preserving transaction/concurrency semantics; test affected billing and gym-owner flows. Re-run repository scan.
4. Verify/fix the Basic dashboard analytics feature entitlement: decide whether its chart is a Basic Reports feature or whether the client must request advanced analytics only for entitled plans; test Basic and higher tiers.
5. Implement the PRD MVP retention list with configurable no-visit days, safe prefilled WhatsApp fee/expiry reminder links, and a scoped reminder log/click audit.
6. Add owner-only audit-log viewing and complete the member lifecycle/contact/photo fields only after deciding the backward-compatible data and private upload design.
7. Decide the trial duration/approval process and whether SaaS billing is MVP; confirm real plan prices/bank details before enabling transfers. Implement a real request/upload workflow only after that decision, with private storage restrictions and abuse controls.
8. Review unfinished public placeholders, confirm advertised feature claims against PRD scope, and manually inspect authenticated responsive layouts, keyboard/focus, contrast and screen readers without resuming mass CSS migration.
9. Confirm production secrets separation, HTTPS, cron authentication, dependency advisories, database indexes, backup schedule and a successful restore drill.

## Manual owner verification needed

- Confirm PKR prices, trial duration/approval, billing review period and bank account information; current values are placeholders/defaults.
- Confirm PRD vs PRODUCT_DETAIL scope conflict for Fitivo SaaS subscriptions and screenshot uploads.
- Confirm production `.env` values are set only in deployment secret storage and not in client-exposed variables; scan repository history and generated client assets.
- Provide a truly isolated disposable database; run synthetic two-gym cross-tenant and role-denial scenarios, financial create/partial/void/retry flows, rate-limit contention, cron and restore drill.
- Verify deployment HTTPS, hosting headers, cron secret, backups/restore ownership and operational monitoring.
- Manually review every authenticated page at 375/768/1280, keyboard-only navigation, screen-reader names, focus return, error/empty/loading states and contrast. Confirm privacy/terms text before public launch.
- Decide whether to remove or safely guard seed scripts before a production deployment.
