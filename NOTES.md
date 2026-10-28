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

## Unresolved
- Automated approval-based 14-day registration requires a separate authorized backend change. Current registration starts a seven-day trial immediately.
- Existing billing supports payment references and manual verification, not screenshot storage. Payment upload UI must not claim to upload or activate access.
- Workout management is coming soon. No class scheduling, member login portal or automated reminder delivery was found; these must not be advertised as working features.

## Review before launch
- Confirm trial approval operations, 24-hour payment review policy, final prices, annual discount and included onboarding services with AKTech.
- Replace bank placeholders and supply approved product screenshots before accepting transfers on the public checkout.
- Source constraints intentionally leave operational billing/auth untouched.
