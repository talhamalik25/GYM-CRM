import { SITE } from "./site.js";
import { BANK } from "./bank.js";

export const FEATURE_DETAILS = {
  "member-management": ["Contact details and member profiles", "Linked membership and payment history", "Trainer assignments"],
  attendance: ["Member check-in and check-out", "Recent visit records", "Attendance summaries"],
  memberships: ["Gym membership plans and durations", "Membership status and expiry dates", "Renewal history"],
  trainers: ["Trainer profiles and assigned members", "Owner, administrator and trainer access", "Staff invitations within plan limits"],
  scheduling: ["Workout management is in development", "Class scheduling is not currently available", "Discuss requirements before choosing a plan"],
  fees: ["Member charges and outstanding dues", "Recorded payments and receipts", "Payment reporting within plan entitlements"],
  renewals: ["Upcoming membership expiries", "Renewal records linked to the member", "Follow-ups sent manually by your team"],
  reports: ["Attendance and collection summaries", "Advanced reporting on eligible plans", "Branch reports where included"],
};

export const PLAN_COMPARISON = [
  { group: "Getting started", rows: [
    { label: "Portal guidance", included: [true, true, true] },
    { label: "Gym setup help", included: [true, true, true] },
  ] },
  { group: "Everyday operations", rows: [
    { label: "Member records & memberships", included: [true, true, true] },
    { label: "Attendance & check-ins", included: [true, true, true] },
    { label: "Member payments & receipts", included: [true, true, true] },
    { label: "Basic reports", included: [true, true, true] },
  ] },
  { group: "Team & reporting", rows: [
    { label: "Full staff management", included: [false, true, true] },
    { label: "Advanced analytics & payment reports", included: [false, true, true] },
    { label: "CSV exports", included: [false, true, true] },
  ] },
  { group: "Multiple locations", rows: [
    { label: "Multi-branch management", included: [false, false, true] },
    { label: "Branch & consolidated reports", included: [false, false, true] },
  ] },
];

export const PRICING_FAQS = [
  { question: "Are these final prices and inclusions?", answer: "No. The catalog is a draft outline. Ask AKTech for a confirmed PKR quote, plan limits and included features before making any payment. The proposed annual discount is also subject to confirmation." },
  { question: "Does the trial require payment details?", answer: `No credit card or upfront payment is required to request the ${SITE.trial.days}-day trial. Requests are reviewed before access is arranged.` },
  { question: "Can we change plans later?", answer: "Existing gym owners can request a plan change from Plan & billing. Changes require review and verified payment. Ask AKTech about the new billing period before transferring funds; do not assume automatic proration or credit." },
  { question: "How is payment verified?", answer: `Confirm your quote and bank instructions with AKTech. Existing owners can submit a transaction reference in Billing. Allow up to ${BANK.reviewWindowHours} hours for manual review; access begins only after verification. Screenshot submission is not currently available.` },
  { question: "Do members have their own login?", answer: "Member records are managed by the gym team. A separate member login portal is not currently available. Trainers have a focused workspace for their assigned members." },
];

export const PAYMENT_STEPS = [
  { title: "Choose", description: "Discuss the plan and billing cycle that fit your gym." },
  { title: "Confirm & transfer", description: "Get your confirmed quote and bank instructions from AKTech before paying." },
  { title: "Share the reference", description: "Existing owners submit their transaction reference in Plan & billing." },
  { title: "Review", description: "Access starts after manual verification, not when a reference is submitted." },
];

export const GUIDE_ROLES = [
  { id: "owner", title: "Gym owner", summary: "Build the foundation before adding everyday records.", steps: [
    "After your trial request is approved and access is arranged, sign in with your owner account.",
    "Review your gym details and branding in Settings. Set up branches if your subscription includes them.",
    "Create membership plans with the correct price and duration before enrolling members.",
    "Add trainers and invite staff using the appropriate available roles. Add members and their memberships.",
    "Review attendance, payment records and reports. Use Plan & billing for your Fitivo subscription and payment references.",
  ] },
  { id: "staff", title: "Front desk & finance", summary: "Keep each visit and payment connected to the right member.", steps: [
    "Sign in using the staff access arranged by your gym owner. Available actions depend on your role and subscription.",
    "Find the existing member record before creating another. Check membership status and the active branch, where applicable.",
    "Record member check-ins and check-outs accurately.",
    "Record member payments against the correct membership and review the amount and payment details before saving.",
    "Use receipts, outstanding dues and available reports to check your records. Follow up on upcoming expiries manually.",
  ] },
  { id: "trainers", title: "Trainers", summary: "Work from your assigned roster.", steps: [
    "Sign in with the trainer account linked to your trainer profile.",
    "Open your Trainer workspace to view the members assigned to you.",
    "Check each assigned member’s membership status, plan and expiry date.",
    "Review recent attendance for your assigned members. Ask the gym administrator to correct assignments or account access.",
  ] },
  { id: "members", title: "Supporting members", summary: "The gym team maintains member records; this is not a member login guide.", steps: [
    "Contact your gym’s front desk to check membership details, fees or renewal dates.",
    "Ask the gym team for your recorded payment receipt or help correcting your details.",
    "Speak with the gym about trainer assignments and its own class or workout arrangements.",
    "There is no separate Fitivo member portal at present. Class scheduling and automated reminder delivery are not currently available.",
  ] },
];

export const TRIAL_STEPS = [
  { title: "Introduce your gym", description: "Prepare your gym and contact details in the form." },
  { title: "Send your request", description: "Review the draft, then send it to AKTech using your email app." },
  { title: "Wait for approval", description: "AKTech reviews the request and contacts you about access. Preparing or sending an email does not activate a trial." },
];

export const CONTACT_TOPICS = ["Product walkthrough", "Pricing & subscriptions", "Gym setup & onboarding", "Technical support", "Other inquiry"];

export const PRINCIPLES = [
  { title: "Clarity in the everyday", description: "Make member details, attendance and payment records easy for the team to follow." },
  { title: "Access follows responsibility", description: "Give owners, administrators and trainers views suited to their work and permissions." },
  { title: "Guidance from the start", description: "Help the gym team understand the setup order and the tools included in its plan." },
];
