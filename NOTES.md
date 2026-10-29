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
