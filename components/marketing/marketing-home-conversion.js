import { ArrowRight, Check, MapPin, Plus, ShieldCheck, Users, UserRoundCheck } from "lucide-react";
import { PLANS, PRICING, marketingPlanAmount } from "../../config/plans.js";
import { MarketingHeading } from "./marketing-primitives.js";
import MarketingShellAction from "./marketing-shell-action.js";
import { StoryLink, StorySection } from "./marketing-story.js";

const roles = [
  [ShieldCheck, "Gym Owner", "Operational oversight", "Manage your gym’s memberships, recorded payments, team access and reports."],
  [Users, "Staff / Front Desk", "The everyday workflow", "Handle member records, payments and attendance according to assigned permissions."],
  [UserRoundCheck, "Trainer", "A focused workspace", "View assigned members, relevant membership details and recent attendance activity."],
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
    <MarketingHeading eyebrow="YOUR TEAM, WITH CONTEXT" title="One gym. Clear responsibilities." />
    <div className="mt-10 grid gap-8 md:grid-cols-3">{roles.map(([Icon, title, subtitle, text]) => <article key={title} className="border-t border-slate-200 pt-6"><Icon size={24} strokeWidth={1.5} aria-hidden="true" className="text-indigo-600" /><h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">{title}</h3><p className="mt-2 text-xs font-medium text-indigo-700">{subtitle}</p><p className="mt-4 text-sm leading-7 text-slate-600">{text}</p></article>)}</div>
    <aside aria-labelledby="locations-title" className="mt-14 flex flex-col gap-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-4"><MapPin size={24} aria-hidden="true" className="mt-1 shrink-0 text-indigo-600" /><div><h3 id="locations-title" className="text-xl font-semibold tracking-tight text-slate-900">Built to grow beyond one location.</h3><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Eligible Professional workspaces can manage supported multi-branch operations within the same organization. Branch limits and capabilities follow your subscription.</p></div></div><div className="shrink-0"><StoryLink href="/pricing">Explore Professional</StoryLink></div></aside>
  </StorySection>;
}

export function GettingStarted() {
  return <StorySection id="how-it-works" className="border-t border-slate-100">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><MarketingHeading eyebrow="HOW FITIVO WORKS" title="A clear start. An everyday routine." /><StoryLink href="/guide">Read the setup guide</StoryLink></div>
    <ol className="mt-10 grid gap-8 md:grid-cols-4 md:gap-0">{steps.map(([title, text], index) => <li key={title} className="relative border-l border-slate-200 pl-6 md:border-l-0 md:border-t md:pl-0 md:pr-6 md:pt-6"><span className="text-sm font-semibold text-indigo-600">0{index + 1}</span><h3 className="mt-3 text-base font-semibold leading-6 text-slate-900">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p></li>)}</ol>
  </StorySection>;
}

export function PricingPreview() {
  return <StorySection id="pricing" className="border-y border-slate-200/70 bg-slate-50">
    <MarketingHeading eyebrow="ROOM TO GROW" title="The right scope for your gym." centered>Start with core operations, add capacity and advanced capabilities as your team grows, or explore eligible multi-branch operations.</MarketingHeading>
    <div className="grid gap-5 lg:grid-cols-3">{PLANS.map(plan => {
      const amount = PRICING.pricesConfirmed ? marketingPlanAmount(plan) : null;
      return <article key={plan.id} className={`flex flex-col rounded-2xl border bg-white p-6 sm:p-8 ${plan.recommended ? "border-indigo-300 shadow-lg shadow-indigo-600/5" : "border-slate-200"}`}>
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
  return <StorySection id="faq"><div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20"><div><MarketingHeading eyebrow="BEFORE YOU START" title="A few practical answers." /><div className="mt-5"><StoryLink href="/contact">Talk to AKTech</StoryLink></div></div><div className="divide-y divide-slate-200 border-y border-slate-200">{questions.map(([question, answer]) => <details key={question} name="homepage-faq" className="group"><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-5 text-base font-medium text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600 [&::-webkit-details-marker]:hidden">{question}<Plus size={18} aria-hidden="true" className="shrink-0 text-indigo-600 transition-transform group-open:rotate-45 motion-reduce:transition-none" /></summary><p className="max-w-2xl pb-6 pr-6 text-sm leading-7 text-slate-600">{answer}</p></details>)}</div></div></StorySection>;
}

export function HomepageClosing() {
  return <StorySection id="start-trial" className="bg-slate-900 text-white"><div className="mx-auto max-w-3xl text-center"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">Your next gym day</p><h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">Ready to run your gym from one connected system?</h2><p className="mx-auto mt-6 max-w-xl text-base leading-7 text-slate-300">Explore Fitivo with a 7-day trial and see how members, payments and attendance work together.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><MarketingShellAction href="/register">Start 7-day trial<ArrowRight size={16} aria-hidden="true" /></MarketingShellAction><MarketingShellAction href="/demo" variant="secondary" className="text-slate-900!">Product Tour</MarketingShellAction></div></div></StorySection>;
}
