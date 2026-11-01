import { BANK } from "./bank.js";

// Public marketing content; this does not change app access or live billing.
export const SITE = {
  name: "Fitivo",
  url: "https://gym-crm-pi.vercel.app",
  company: "AKTech Digital Solutions",
  companyUrl: "https://aktech.tech",
  email: "hello@aktech.tech",
  phone: "+92 371 3410797",
  phoneHref: "tel:+923713410797",
  location: "Karachi, Pakistan",
  region: "PK",
  announcement: "Portal guides & setup guidance included",
  tagline: "Your gym day. Better connected.",
  description: "Members, people and daily operations in one gym management workspace.",
  trial: {
    days: 14,
    approvalRequired: true,
    creditCardRequired: false,
    note: "14-day trial · Approval required",
    microcopy: "14-day trial · No credit card · Approval required",
    // The approved 14-day request workflow is not implemented. /register currently
    // starts an immediate seven-day trial and must not be repurposed here.
    requestMode: "email",
    requestSubject: "Fitivo: request a 14-day gym trial",
  },
  navigation: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Demo", href: "/demo" },
    { label: "Portal guide", href: "/guide" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  explore: [
    { label: "Features", href: "/features" },
    { label: "Plans & pricing", href: "/pricing" },
    { label: "Product demo", href: "/demo" },
    { label: "Portal guide & onboarding", href: "/guide" },
    { label: "Request a free trial", href: "/free-trial" },
    { label: "Portal login", href: "/login" },
  ],
};

export const MARKETING_PAGES = {
  features: { eyebrow: "The product / Connected operations", title: "The work of a gym. In one place.", description: "Keep member records, memberships, check-ins and recorded payments connected to your gym and team.", link: { href: "/#features", label: "Explore current features" } },
  pricing: { eyebrow: "Pricing / Room to grow", title: "A plan for your gym’s next chapter.", description: "Marketing plan prices are awaiting confirmation. Contact AKTech for a quote; existing gym owners can view their current subscription in Plan & billing.", link: { href: "/billing", label: "Open plan & billing" } },
  demo: { eyebrow: "Inside Fitivo / Product overview", title: "See how your gym fits together.", description: "Explore four connected workspaces. Ask AKTech for a guided walkthrough of the live product.", link: { href: "/free-trial", label: "Request a guided trial" } },
  guide: { eyebrow: "Fitivo / Getting started", title: "A clear start for your team.", description: "Start with your gym setup and membership plans, then add members and staff. Ask AKTech for portal guidance and help applying Fitivo to your daily routine.", link: { href: "/#how-it-works", label: "See the setup steps" } },
  about: { eyebrow: "Fitivo / By AKTech Digital Solutions", title: "For the people behind every gym day.", description: "Fitivo brings member records, attendance, memberships and payments into a shared workspace. A sister product to Acadivo, built by AKTech Digital Solutions in Karachi, Pakistan.", link: { href: "/contact", label: "Talk to AKTech" } },
  contact: { eyebrow: "Contact / AKTech Digital Solutions", title: "Let’s talk about your gym.", description: "Ask about Fitivo, pricing, setup guidance or a walkthrough for your team. Tell us how your gym works and where you want to start." },
  "free-trial": { eyebrow: "Your gym / A connected start", title: "Request a 14-day trial.", description: "Contact AKTech with your name, gym name and email to request a trial. Approval is required before access is arranged. No credit card or upfront payment is needed to request it." },
};




export const FEATURES = [
  { id: "member-management", icon: "members", title: "Member management", description: "A clear record for every member, from contact details to membership and payment history." },
  { id: "attendance", icon: "attendance", title: "Attendance & check-ins", description: "Record arrivals and departures. Keep recent visits close to the people running the front desk." },
  { id: "memberships", icon: "plans", title: "Memberships & plans", description: "Set up your gym’s plans, track expiry dates and keep each renewal connected to the member." },
  { id: "trainers", icon: "trainers", title: "Trainer & staff management", description: "Organize trainer profiles, assign members and give staff access for their responsibilities." },
  { id: "scheduling", icon: "schedule", title: "Class & workout scheduling", description: "Discuss your scheduling needs with us. Workout planning is in development; class scheduling is not available yet.", status: "Planned" },
  { id: "fees", icon: "fees", title: "Fees, invoices & receipts", description: "Keep member charges, payment records, outstanding dues and receipts together." },
  { id: "renewals", icon: "renewals", title: "Expiry & renewal reminders", description: "See upcoming expiries and follow up with members. Reminders are handled by your team, not sent automatically.", status: "Manual follow-up" },
  { id: "reports", icon: "reports", title: "Reports & insights", description: "Review attendance and recorded collections, with deeper reporting where your plan includes it." },
];

export const PRODUCT_VIEWS = [
  { id: "administration", label: "Gym administration", title: "Your gym, in view.", description: "Member records, membership status and your team’s daily operations.", areas: ["Member records", "Memberships", "Staff access"], screenshot: "/dashboard.png" },
  { id: "fees", label: "Fees & billing", title: "Keep the records together.", description: "Member fees, recorded payments, outstanding dues and receipts.", areas: ["Member ledgers", "Payment records", "Receipts"] },
  { id: "attendance", label: "Attendance & check-ins", title: "A clear record of every visit.", description: "Check-in and check-out records, with recent attendance in one place.", areas: ["Check-ins", "Check-outs", "Visit history"] },
  { id: "reports", label: "Reports & insights", title: "See what your records tell you.", description: "Attendance and collection summaries, subject to your plan and permissions.", areas: ["Attendance", "Collections", "Memberships"] },
];

export const ROLES = [
  { title: "Gym owner", description: "Oversee your gym’s people, memberships, recorded payments and reports.", note: "The wider view" },
  { title: "Trainers", description: "View assigned members, their membership details and recent attendance.", note: "A focused workspace" },
  { title: "Front desk & finance", description: "Handle check-ins, member records and payments through authorized staff access.", note: "The everyday operations" },
  { title: "Members", description: "Benefit from organized records and clearer fee conversations with your gym’s team.", note: "Team-managed records" },
];

export const ONBOARDING = [
  { title: "Set up", description: "Add your gym details and branding, create membership plans and set up branches where included." },
  { title: "Bring people together", description: "Add members and trainers, then invite staff with the right access." },
  { title: "Run the gym day", description: "Record attendance, memberships and fees. Discuss scheduling needs during onboarding." },
  { title: "See the full picture", description: "Review reports built from the records your team maintains." },
];

export const GUIDANCE = [
  { title: "Portal-by-portal guidance", description: "Understand the owner, administrator and trainer workspaces, and where each responsibility belongs." },
  { title: "A structured gym setup", description: "Work through your gym details, plans, people and the operations included in your subscription." },
  { title: "Help applying it to your gym", description: "Talk to AKTech about a walkthrough based on the way your team works." },
];

export const FAQS = [
  { question: "How do we get started?", answer: "Request a 14-day trial through the free-trial page. AKTech reviews your request and arranges access after approval. No credit card is needed to request a trial." },
  { question: "Will you help our team learn the software?", answer: "Yes. Portal guidance and setup help are included with every plan. Start with the portal guide or contact AKTech to discuss a walkthrough for your team." },
  { question: "Does everyone use the same dashboard?", answer: "Access follows responsibility. Owners and authorized administrators manage gym operations; trainers have a workspace for their assigned members. Member records are managed by the gym’s team; a separate member login portal is not currently available." },
  { question: "How does paid activation work?", answer: `Confirm your plan, quote and bank instructions with AKTech, then transfer the quoted amount. Allow up to ${BANK.reviewWindowHours} hours for manual review. ${BANK.activationNote} Existing owners can submit a payment reference in Billing. Screenshot submission is not available yet.` },
  { question: "What do the plans include?", answer: "Every plan includes portal guidance and setup help. Operational features and limits depend on your subscription. The plan outlines on this site are provisional; confirm pricing and inclusions with AKTech before payment." },
];




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

export const DEMO_ROLES = [
  { id: "owner", label: "Gym owner", title: "The wider view of your gym.", description: "Bring your people, memberships and daily records together.", items: ["Gym setup and membership plans", "Members, trainers and staff", "Payments and reports within your plan"] },
  { id: "trainer", label: "Trainer", title: "A workspace for your assigned members.", description: "See the member details and recent attendance relevant to your work.", items: ["Assigned member roster", "Membership status and expiry dates", "Recent attendance"] },
  { id: "staff", label: "Front desk & finance", title: "Keep the everyday records moving.", description: "Use authorized staff access for front-desk and payment responsibilities.", items: ["Member records and check-ins", "Recorded payments and receipts", "Outstanding dues and manual follow-ups"] },
];

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "";
const supportWhatsApp = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.trim() || "";

function emailChannel(value) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null;
  return { href: `mailto:${value}`, label: value };
}

function whatsappChannel(value) {
  if (/^\+?[\d\s()-]{8,20}$/.test(value)) {
    const phone = value.replace(/\D/g, "");
    return phone ? { href: `https://wa.me/${phone}`, label: "WhatsApp" } : null;
  }

  try {
    const url = new URL(value);
    if (url.protocol === "https:" && ["wa.me", "api.whatsapp.com"].includes(url.hostname)) {
      return { href: url.toString(), label: "WhatsApp" };
    }
  } catch {
    return null;
  }
  return null;
}

export const MARKETING_SUPPORT_CHANNEL = Object.freeze(
  emailChannel(supportEmail) || whatsappChannel(supportWhatsApp),
);
