import { ArrowRight, Check, MapPin, Plus } from "lucide-react";
import { PLANS, PRICING, marketingPlanAmount } from "../../config/plans.js";

import MarketingShellAction from "./marketing-shell-action.js";
import { StoryHeading, StoryLink, StorySection } from "./marketing-story.js";

const roles = [
  ["Gym Owner", "Operational oversight", "Manage your gym’s memberships, recorded payments, team access and reports."],
  ["Staff / Front Desk", "The everyday workflow", "Handle member records, payments and attendance according to assigned permissions."],
  ["Trainer", "A focused workspace", "View assigned members, relevant membership details and recent attendance activity."],
];
const steps = [
  ["Start your 7-day trial", "Create an eligible owner account when public registration is available."],
  ["Set up your gym", "Add your gym details and membership plans."],
  ["Add your members and team", "Bring member records into Fitivo and give your team appropriate access."],
  ["Run everyday operations in Fitivo", "Record memberships, payments and visits, then review the day’s records."],
];
const questions = [
  ["What can I manage with Fitivo?", "Fitivo connects members, memberships, recorded payments, receipts, attendance and your team’s daily work. Reporting and other capabilities depend on your plan and permissions."],
  ["How does the 7-day trial work?", "When public registration is available, eligible new gym owners can create an account and start a seven-day trial without a payment card. Trial eligibility is checked during registration. Paid access after the trial requires verified payment. If registration is closed, use the access options on the registration page."],
  ["Can my staff use Fitivo?", "Yes. Owners can give staff access to everyday member, payment and attendance workflows according to their permissions. Team capacity and staff-management capabilities depend on the workspace’s plan."],
  ["Can trainers have their own access?", "Yes. Trainers have a focused workspace for assigned members and relevant membership and attendance information. A separate member login portal is not currently available."],
  ["Does Fitivo record member payments?", "Yes. Your team can record member payments, including partial payments, review dues and find receipts. Membership and renewal records provide the context for those payments."],
  ["Can I manage multiple gym locations?", "Eligible Professional workspaces support multiple branches within the same organization. Branch limits and reporting capabilities follow the workspace’s subscription; branches are not unlimited."],
  ["Does Fitivo automatically collect payments?", "No. Fitivo records payments entered by your team. It does not automatically charge members or collect their fees."],
];

export function TeamAndLocations() {
  return <StorySection id="roles">
    <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-20">
      <div><StoryHeading eyebrow="ONE GYM. DIFFERENT RESPONSIBILITIES." title={<>Everyone has a role.<br />Every view has a purpose.</>}>Give each person the context for their part of the gym day. Accounts and permissions determine what they can see and do.</StoryHeading><div className="mt-6"><StoryLink href="/demo">Explore the workspaces</StoryLink></div></div>
      <ol className="divide-y divide-slate-200 border-y border-slate-200">{roles.map(([title, subtitle, text], index) => <li key={title} className="flex gap-5 py-8"><span className="pt-1 text-xs font-semibold text-indigo-600">0{index + 1}</span><div><h3 className="text-xl font-medium tracking-tight text-slate-900">{title}</h3><p className="mt-2 text-xs text-slate-500">{subtitle}</p><p className="mt-3 text-sm leading-7 text-slate-500">{text}</p></div></li>)}</ol>
    </div>
    <aside aria-labelledby="locations-title" className="mt-16 grid gap-7 rounded-2xl bg-indigo-50/60 p-7 sm:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16"><div><p className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500"><MapPin size={14} aria-hidden="true" />Built to grow</p><h3 id="locations-title" className="text-3xl font-medium leading-tight tracking-tight text-slate-900">One business.<br />More than one location.</h3></div><div><p className="text-base leading-8 text-slate-600">Eligible Professional workspaces support multi-branch operations within the same organization. Branch limits and reporting capabilities follow your subscription.</p><div className="mt-4"><StoryLink href="/pricing">Explore Professional</StoryLink></div></div></aside>
  </StorySection>;
}

export function GettingStarted() {
  return <StorySection id="how-it-works" className="bg-slate-50">
    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><StoryHeading eyebrow="A CLEAR WAY IN" title={<>From setup<br />to everyday operations.</>} /><StoryLink href="/guide">Read the setup guide</StoryLink></div>
    <ol className="mt-14 grid gap-8 md:grid-cols-4 md:gap-0">{steps.map(([title, text], index) => <li key={title} className="relative border-l border-slate-200 pl-6 md:border-l-0 md:border-t md:pl-0 md:pr-6 md:pt-8"><span className="relative -ml-11 mb-4 grid size-10 place-items-center rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-indigo-600 md:absolute md:-top-5 md:ml-0">0{index + 1}</span><h3 className="text-base font-semibold leading-6 text-slate-900">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-500">{text}</p></li>)}</ol>
  </StorySection>;
}

export function PricingPreview() {
  return <StorySection id="pricing" className="bg-white">
    <StoryHeading eyebrow="BUILT FOR DIFFERENT STAGES" title={<>The right plan.<br />Room to grow.</>}>Start with core operations, add capacity and advanced capabilities as your team grows, or explore eligible multi-branch operations.</StoryHeading>
    <div className="mt-12 grid gap-5 lg:grid-cols-3">{PLANS.map(plan => {
      const amount = PRICING.pricesConfirmed ? marketingPlanAmount(plan) : null;
      return <article key={plan.id} className={`flex flex-col rounded-2xl border bg-slate-50/50 p-6 sm:p-8 ${plan.recommended ? "border-indigo-300 bg-indigo-50/40 shadow-lg shadow-indigo-600/5" : "border-slate-200"}`}>
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>{plan.recommended && <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">For growing gyms</span>}</div>
        <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{plan.description}</p>
        <p className="mt-6 text-xs font-medium uppercase tracking-widest text-slate-500">{PRICING.currency} · Monthly quote</p><p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{amount === null ? PRICING.placeholderLabel : `${new Intl.NumberFormat("en-PK").format(amount)} / month`}</p>
        <ul className="mb-8 mt-7 space-y-3">{plan.highlights.map(text => <li key={text} className="flex gap-2 text-sm leading-6 text-slate-600"><Check size={16} aria-hidden="true" className="mt-1 shrink-0 text-indigo-600" />{text}</li>)}</ul>
        <MarketingShellAction href="/contact" variant={plan.recommended ? "primary" : "secondary"} className="mt-auto" aria-label={`Discuss ${plan.name} with Fitivo`}>Discuss {plan.name}<ArrowRight size={16} aria-hidden="true" /></MarketingShellAction>
      </article>;
    })}</div>
    <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-6 text-slate-500">{PRICING.pricesConfirmed ? "Plan availability and inclusions are confirmed with your quote." : "Draft plan outlines. Prices and final inclusions are confirmed with your quote."} No payment is collected here. {PRICING.paymentNote}.</p>
    <div className="mt-4 text-center"><StoryLink href="/pricing">Compare plan outlines</StoryLink></div>
  </StorySection>;
}

export function HomepageFaq() {
  return <StorySection id="faq" className="bg-slate-50"><div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20"><div><StoryHeading eyebrow="BEFORE YOU GET STARTED" title={<>A few useful<br />questions.</>} /><div className="mt-5"><StoryLink href="/contact">Talk to AKTech</StoryLink></div></div><div className="divide-y divide-slate-200 border-y border-slate-200">{questions.map(([question, answer]) => <details key={question} name="homepage-faq" className="group"><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-5 text-base font-medium text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600 [&::-webkit-details-marker]:hidden">{question}<Plus size={18} aria-hidden="true" className="shrink-0 text-indigo-600 transition-transform group-open:rotate-45 motion-reduce:transition-none" /></summary><p className="max-w-2xl pb-6 pr-6 text-sm leading-7 text-slate-600">{answer}</p></details>)}</div></div></StorySection>;
}

export function HomepageClosing() {
  return <StorySection id="start-trial" className="bg-slate-900 text-white"><div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-center lg:gap-16"><StoryHeading inverse eyebrow="YOUR GYM. BETTER CONNECTED." title={<>Run your gym<br />from one connected system.</>}>Bring members, memberships, payments and attendance into one operational workspace.</StoryHeading><div className="flex flex-col gap-3 sm:flex-row lg:flex-col"><MarketingShellAction href="/register" className="min-h-12">Start 7-Day Trial<ArrowRight size={16} aria-hidden="true" /></MarketingShellAction><MarketingShellAction href="/pricing" variant="secondary" className="min-h-12 text-slate-900!">View Plans</MarketingShellAction></div></div></StorySection>;
}
