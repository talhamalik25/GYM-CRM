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
