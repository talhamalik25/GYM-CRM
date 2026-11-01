# Fitivo marketing rebuild

## Step 1 — audit
- Inspected the existing marketing components and all eight Acadivo reference pages, including browser captures and typography/spacing.
- Reuse the Fitivo brand, shared component patterns, accessible navigation/tabs and existing manual billing verification semantics.
- Keep auth, dashboard, database models and existing API routes unchanged. Auth shares the old marketing primitives/CSS, so new marketing styles are isolated.
- Keep `app/page.js` at its existing path (no file deletion). It will use the same marketing shell as the new `(marketing)` route group.

## Assumptions and placeholders
- The public 14-day offer is a manually requested trial through AKTech, subject to approval; the existing automatic seven-day registration endpoint is not used by this offer or changed.
- Marketing pricing is an explicitly labeled example, not a payable quote or the operational database catalog. Confirm before enabling checkout.
- No real app screenshots were found. New marketing views use clearly labeled placeholder frames, not fabricated screenshots or records.
- AKTech contact verified from https://acadvio.vercel.app/contact: hello@aktech.tech, +92 371 3410797, Karachi, Pakistan; https://www.aktech.tech/.

## Homepage continuation — October 28, 2026
- Continued the homepage rebuild with shared feature cards, keyboard-accessible product tabs, quote-based pricing, role/onboarding sections and FAQs.
- Connected the pricing and demo routes to the shared components; feature links resolve to their detail-page anchors.
- Demo copy now describes the labeled screenshot placeholders. The annual discount is explicitly proposed pending confirmation.
- Validation: production build passed. Database-disabled browser checks passed for all eight marketing routes, feature anchors, product-tab keyboard navigation, monthly/annual quote links, FAQ expansion, trial email links and mobile navigation. Layouts checked at 320, 390, 768 and 1440 pixels with no horizontal overflow or clipped content; no browser runtime errors.
- Existing database-disabled security/login smoke checks passed. Authenticated/database workflows were not exercised. Local screenshots and the verification script are in ignored `test-results/`.
- Supporting guide, about, contact and trial pages retain their existing introductory content. Approved screenshots, confirmed commercial terms and the backend trial workflow remain outstanding below.

## Unresolved
- Automated approval-based 14-day registration requires a separate authorized backend change. Current registration starts a seven-day trial immediately.
- Existing billing supports payment references and manual verification, not screenshot storage. Payment upload UI must not claim to upload or activate access.
- Workout management is coming soon. No class scheduling, member login portal or automated reminder delivery was found; these must not be advertised as working features.

## Review before launch
- Confirm trial approval operations, 24-hour payment review policy, final prices, annual discount and included onboarding services with AKTech.
- Replace bank placeholders and supply approved product screenshots before accepting transfers on the public checkout.
- Source constraints intentionally leave operational billing/auth untouched.

## Step 4 — marketing sub-pages
- Completed features, pricing, demo, guide, about, contact and free-trial pages using the shared indigo layout.
- Added module detail anchors, a clearly provisional plan comparison, role-based demo tabs, practical role guides and reusable guidance/CTA sections.
- Contact and trial forms validate fields and prepare an email draft for the visitor to review and send. They do not submit requests, create accounts or activate trials. Copy fallback is available; a dedicated backend remains TODO.
- Preserved the proposed annual discount label, unconfirmed pricing and clearly labeled screenshot placeholders.
- Validation: final production build passed; all seven pages checked at 375, 768 and 1280 pixels. Checked 31 internal links, role tabs, billing controls, FAQ keyboard access, draft encoding, validation and copy fallback. No browser errors or form submission requests were observed.
- Fixed comparison-table overflow on narrow screens and isolated its text size from dashboard table styles. Auth, dashboard, database models and existing API routes were not changed.
- Paused before Step 5: payment page UI.

## Step 5 — payment page UI
- Added `/payment` within the marketing layout, with plan/cycle selection, a quote summary, bank details from the single BANK config, screenshot preview and manual review guidance.
- Home and pricing plan cards now link to the selected plan and billing period. Invalid or repeated query values fall back to a visible, reviewable selection; URL parameters cannot set a payable amount.
- Prices remain unconfirmed and bank placeholders are explicitly labeled. Quote requests open the visitor's email app. Access activates only after verification, with a stated review window of up to 24 hours.
- Screenshot selection is local only, validates PNG/JPG/WebP files up to 5 MB, supports removal and clears previews when the selection changes. Submission stays disabled; authenticated storage, invoice association and review integration are marked TODO. Existing owners can use the unchanged Billing reference-claim flow.
- Validation: production build passed. Browser checks passed for home/pricing handoff, 375/768/1280 layouts, keyboard billing selection, invalid queries, file type/size/decode errors, preview removal and cleanup. Production emitted no browser errors or submission requests. Refreshed the development server after detecting stale pricing markup.
- Dashboard, auth, database models and existing API routes were not changed. Pre-existing global stylesheet edits were preserved.
- Paused before Step 6: chatbot UI, API route and knowledge base.

## Existing-project document audit — 2026-10-31

- Scope: audit only; application code, auth, APIs, models and data unchanged. Read AGENTS.md, PRD.md, ARCHITECTURE.md, DESIGN_SYSTEM.md, SECURITY.md and PRODUCT_DETAIL.md completely before documentation edits.
- Assumed acceptance criteria: inventory all existing page/API routes and models; compare each document with concrete code evidence; rank security/data-integrity and quality gaps; report checks and uncertainties; change only factual stack claims in ARCHITECTURE.md.
- Created PRODUCT_SPEC.md (43 source pages, 43 API routes / 62 HTTP handlers, 18 persisted models plus shared schemas, module statuses, env/config and per-page CSS dependency footprint) and ALIGNMENT_REPORT.md (ranked findings, document conflicts, recommended fix sequence).
- ARCHITECTURE.md changes are limited to Stack: verified Next/React/Tailwind/Mongoose versions, PostCSS setup, custom opaque sessions with scrypt, Mongo deployment/transaction requirements and unverified hosting. Preserved all proposed structure/model/flow sections; their disagreements are reported instead of silently rewritten. ARCHITECTURE.md was an existing untracked owner-provided draft, so the commit adds its full supplied content with only this section corrected.
- Working tree was dirty on arrival, including AGENTS.md, application/marketing CSS and scripts, a deleted old marketing CSS file and untracked source documents/logo. Preserved all of it; audit branch is codex/project-document-audit. Stage only PRODUCT_SPEC.md, ALIGNMENT_REPORT.md, ARCHITECTURE.md and NOTES.md.
- Safest assumptions: no real DB writes or destructive integration cleanup; existing test DB config is not independent proof of a disposable environment. Public browser runs explicitly blanked MongoDB variables and disabled registration. Read-only unit/mock checks do not establish real tenant isolation.
- Verification: build passed after network retry for existing font; lint passed; unit tests 144 passed/1 failed/8 skipped (153 total). Existing reports CSS source-string assertion failed at tests/reports.test.js:171 and was not modified. Browser smoke passed; 42 public/access viewport checks passed with no overflow or uncaught page errors; mobile menu open/Escape close passed. npm audit found 16 moderate tooling-chain packages, no high/critical; no dependency changes.
- Unresolved: role/price authorization, member audit/void/actor support, registration throttling, WhatsApp/retention, trial contract and screenshot workflow, Basic dashboard entitlement mismatch, live database/role/tenant/financial verification, dependency advisory and stale test. PRD defers subscription billing while PRODUCT_DETAIL puts it in MVP; do not resolve that scope conflict by building extra features. Existing design values take precedence; no CSS migration resumed.

## Structure and config alignment — 2026-11-01

- Moved public identity/contact data, reusable marketing content, FAQs/guides and demo role data into config/site.js; moved public placeholder pricing and operational launch catalog/features/limits into config/plans.js; moved bank placeholders/review guidance and local screenshot preview constraints into config/bank.js. Updated marketing consumers. Removed the superseded five lib/marketing config files.
- Existing exports from lib/saasPlanRules.js and lib/marketingConfig.js remain compatible through re-exports; APIs/models/auth were not changed. Admin billing form defaults now read the catalog limits rather than duplicate them. No routes were renamed and no CSS/layout/copy was rewritten.
- Pricing assumption: keep existing operational 2999/5999/9999 initialization values to preserve behavior and existing tests; they are explicitly labeled unconfirmed defaults, not public quotes. Public prices remain null and bank details remain disabled placeholders. Stored catalog/invoice/subscription values are untouched. Seed/test fixture prices and illustrative preview data are not live commercial configuration and were not changed. “Magic values” in this task means site/commercial/preview policy values, not a refactor of layout classes, date units or form mechanics.
- Removed components/auth/route-guard.js and components/marketing/marketing-page-intro.js after checking application, component, library, script and test references; removed the latter’s unused trialRequestHref helper. Old migration-plan documents mention the retired intro historically, but no executable code references it. No debug/test/seed API routes were found. Referenced login/register preview and migration tools were preserved.
- .env.example now contains empty names-only assignments, including optional public support and existing isolated-test/admin variables. Verified .env/.env.local/.env.test.local/.env.production are ignored and only .env.example is tracked. No actual secret files were opened or changed. Limited pattern scan found no embedded Mongo credentials, private-key blocks, sk-style or AWS keys in 244 source files. This is not a historical/bundle secret certification. Config modules contain only public-safe values.
- ARCHITECTURE.md documents the current config boundary and env defaults. Previous audit reports remain dated snapshots. All unrelated pre-existing staged changes are excluded from this task’s commit.
- Verification: npm run build and npm run lint passed. Direct before/after comparisons passed for all moved data, operational launch catalog, legacy/plan entitlements and monthly/annual pricing behavior. Names-only env validation passed. Full unit run: 144 passed, one unchanged reports CSS source-string failure, eight database suites skipped (153 total). Existing database-free browser smoke passed. No seed/migration/account/financial writes were run.
- Remaining mismatches outside this task: unconfirmed final prices, seven-day automatic registration versus fourteen-day requested trial, absent screenshot backend, payment/role/security findings from ALIGNMENT_REPORT.md, and legacy styling. Live database/admin billing flows were not exercised; compatibility was checked with existing tests and pure config/entitlement comparisons.
- Additional browser verification passed: 11 affected public/auth routes at 375/768/1280 (33 checks), annual pricing-to-payment handoff, bank placeholders and disabled submission, invalid-file rejection and local preview removal, fourteen-day email draft and keyboard demo tabs; no POSTs or uncaught page errors. Initial harness read the URL before client navigation completed; rerun with an explicit navigation wait passed without application changes.

## Final alignment check — 2026-11-01

- Re-ran source inventories against AGENTS.md, PRD.md, ARCHITECTURE.md, DESIGN_SYSTEM.md, SECURITY.md and PRODUCT_DETAIL.md. Refreshed PRODUCT_SPEC.md and replaced the outdated A1 ALIGNMENT_REPORT.md with current findings, A1 comparison, SECURITY.md pre-launch checklist, open MVP scope and owner verification list.
- Removed `app/dev/ui/page.js` after repo-wide code search found no references. No other debug route was found. Seed scripts were preserved; they are scripts, not routes, and this task did not establish them as dead code.
- Security state now documented accurately: A1 price-control, owner role, member payment void/audit and registration rate-limit findings have subsequent fixes/tests; full tenant/role coverage remains unverified. AuditLog is present and records required actions, but no owner viewer/API exists. Current source still has four trusted document `.$where` save guards in three routes, so the prior A3 zero-use acceptance is not met; no such handler changes were made here.
- Verification: `npm run test:unit` reports 227 tests, 215 pass, 8 skip, 4 failures counted including the nested trainer test. Causes: the reports-page source test assumes no args to its page guard; the trainer test mock does not match the gym-scoped query; tenantFoundation expects the old `requireApiUser()` helper spelling in exports though source requires owner via `requireRole()` and scopes via `tenantFilter()`. `npm test` refuses before DB tests because the configured host/credentials are not independently isolated. No environment value was displayed or altered.
- `/dev/ui` removal is the only application-source change. Build/lint status is recorded in ALIGNMENT_REPORT.md after execution. This was documentation/audit work, not an A3 repair; do not treat the checklist as launch clearance.

## Test fixes and isolated test URI — 2026-11-01

- Reviewed all four remaining document save guards. Each filter is exactly `{ gymId: <document>.gymId }` or `{ gymId: gym._id }`. The Gym billing route loads the invoice with both `validation.invoiceId` and the session-derived `context.gymId`; its `.gymId` is read from that Mongoose result. Admin claim rejection loads the open invoice by validated `validation.invoiceId`, then checks/locks the Gym using the database invoice's `gymId`; the guard takes that database value. Admin invoice void loads by the validated body invoice id, then the guard takes `invoice.gymId` from the returned database record. Owner assignment looks up the active Gym using the validated assignment gym id; `gym._id` is from the returned Gym document. No guard filter includes a request object, query parameter, route parameter, or raw input. All four are marked Safe and left unchanged.
- Fixed the page-guard test to assert that the server guard is called with or without an explicit policy argument. The page explicitly restricts reports to `gym_owner`, as required by SECURITY.md.
- Fixed the foreign-trainer test fixture: `Trainer.findOne` already asserted session gym scope; `Member.find` was unstubbed and buffered against MongoDB, yielding a test-only 500. Added a mock returning an empty assigned-member list and asserting the same trusted gym scope. Production route filters were not changed.
- Updated the tenant-route source assertion to recognize both current authenticated helpers (`requireApiUser` and `requireRole`), so owner-only routes such as exports are accepted while requiring a separate tenant scope assertion.
- Test DB connection variable is now only `MONGODB_URI_TEST`. `.env.example` has a blank name-only entry; runner, integration fixtures, smoke scripts and current setup docs read/clear that variable. The host/credential reuse and test-name preflight remains unchanged. To run DB integration tests, create a dedicated cluster or local replica set on a separate host/port with distinct least-privilege test credentials, then set `MONGODB_URI_TEST` in ignored `.env.test.local`; see README.md and tests/INTEGRATION_TESTING.md. Remote clusters still require explicit disposable designation. No database URI was printed or changed.
- Verification: targeted page-guard, foreign-resource/trainer, and tenant-route tests pass. Full `npm run test:unit`: 227 total, 219 passed, 0 failed, 8 database-backed suites skipped. Skips are expected for unit-only execution; no integration connection was attempted. `npm run lint` and `npm run build` both passed.

## Logo and marketing image alignment

- `public/logo.png` is the only supplied Fitivo logo asset. It is the full wordmark with dark lettering and is used on light surfaces; dark sections place it on a white surface. No icon-only, light wordmark, Apple touch icon, or approved social image was supplied.
- The generic Next.js favicon and the prior separately drawn social graphic were removed. A proper branded favicon/app icon remains unavailable until an icon-only asset is provided.
- Dashboard screenshots were not created. There is no `MONGODB_URI_TEST` configured and no local MongoDB service/binary available. I did not seed or inspect the configured application database. The marketing sections now describe actual product areas without simulated screen captures.
- The login, register, free-trial, and marketing routes use the shared marketing brand. No forgot-password route exists in this project.
- The receipt dialog is the only printable financial document found; its header now uses the supplied logo. No invoice or report print/export header was found.
