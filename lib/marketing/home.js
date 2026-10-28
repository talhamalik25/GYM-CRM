import { BANK } from "./bank.js";

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
  { id: "administration", label: "Gym administration", title: "Your gym, in view.", description: "Member records, membership status and your team’s daily operations.", areas: ["Member records", "Memberships", "Staff access"] },
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
