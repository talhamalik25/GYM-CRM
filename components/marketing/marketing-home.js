import Link from "next/link";
import { Activity, ArrowRight, Building2, CalendarCheck2, Check, ChartNoAxesColumn, CreditCard, Dumbbell, ShieldCheck, Users, WalletCards } from "lucide-react";
import { FEATURE_LABELS } from "../../lib/saasPlanRules.js";
import MarketingFooter from "./marketing-footer.js";
import MarketingNavigation from "./marketing-navigation.js";
import MarketingProductShowcase from "./marketing-product-showcase.js";
import { MarketingPill, MarketingPrimaryAction, MarketingSection } from "./marketing-primitives.js";

const features = [
  { icon: Users, title: "Member records in one place", text: "Keep profiles, contact details, membership status, and history organized.", tier: "Available across plans" },
  { icon: CalendarCheck2, title: "Memberships and renewals", text: "Create memberships, see upcoming expiries, and retain renewal history.", tier: "Available across plans" },
  { icon: Activity, title: "Attendance, clearly tracked", text: "Understand check-ins and daily activity across your gym.", tier: "Available across plans" },
  { icon: CreditCard, title: "Payment records", text: "Record member payments and review balances, receipts, and history.", tier: "Available across plans" },
  { icon: Dumbbell, title: "A coordinated team", text: "Manage trainers and staff with gym-scoped roles and access.", tier: "Plan limits apply" },
  { icon: ChartNoAxesColumn, title: "Reports for better decisions", text: "Review collections, attendance, member activity, and trends.", tier: "Advanced reports on eligible plans" },
  { icon: WalletCards, title: "Billing visibility", text: "View your Fitivo subscription, invoices, and manual payment status.", tier: "Available across plans" },
  { icon: Building2, title: "Room for more locations", text: "Bring multiple branches into one organization workspace.", tier: "Professional plan" },
];

const coreFeatures = ["members", "memberships", "attendance", "payments", "staff", "reports", "branches"];

const price = (value) => `PKR ${Number(value).toLocaleString("en-PK")}`;
const limit = (value, noun) => value == null ? `Unlimited ${noun}` : `${Number(value).toLocaleString("en-PK")} ${noun}`;

function PlanCard({ plan, trialAvailable }) {
  const included = Object.entries(plan.features || {}).filter(([, enabled]) => enabled).map(([key]) => FEATURE_LABELS[key]).filter(Boolean);
  const highlighted = plan.key === "pro";
  return <article className={`flex flex-col rounded-2xl border bg-surface p-6 ${highlighted ? "border-brand shadow-lg shadow-brand/10 lg:-translate-y-2" : "border-line"}`}>
    <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-ink">{plan.name}</h3><p className="mt-1 text-xs leading-5 text-ink-muted">{plan.key === "professional" ? "For gyms operating across locations." : plan.key === "pro" ? "For a growing gym ready for more insight." : "The essentials for an organized gym."}</p></div>{highlighted && <MarketingPill className="shrink-0 px-2 py-1 text-[9px]">Popular</MarketingPill>}</div>
    <p className="mt-6 text-3xl font-bold tracking-tight text-ink">{price(plan.price)}<span className="text-xs font-medium text-ink-muted">/{plan.interval === "yearly" ? "year" : "month"}</span></p>
    <p className="mt-1 text-[10px] text-ink-subtle">{plan.interval === "yearly" ? "Billed yearly" : "Billed monthly"} · PKR</p>
    <div className="my-5 grid grid-cols-2 gap-3 border-y border-line py-4 text-[10px] text-ink-muted"><span>{limit(plan.limits?.members, "members")}</span><span>{limit(plan.limits?.staff, "staff")}</span><span>{plan.limits?.branches ?? 1} {plan.limits?.branches === 1 ? "branch" : "branches"}</span></div>
    <ul className="mb-6 grid gap-3">{included.map((feature) => <li key={feature} className="flex gap-2 text-xs text-ink-muted"><Check className="shrink-0 text-brand" size={15} aria-hidden="true" />{feature}</li>)}</ul>
    <MarketingPrimaryAction trialAvailable={trialAvailable} className={`mt-auto w-full ${highlighted ? "" : "border border-line bg-surface text-ink hover:border-brand hover:bg-brand-soft/50"}`} />
  </article>;
}

function TrialSection({ trialAvailable, trialPlanName }) {
  return <MarketingSection id="trial" className="bg-brand-soft/50">
    <div className="grid items-center gap-10 md:grid-cols-[1.05fr_.95fr]">
      <div><p className="text-xs font-bold uppercase tracking-[.16em] text-brand">{trialAvailable ? "A week to get familiar" : "Access to Fitivo"}</p>
        <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">{trialAvailable ? <>Try Fitivo with your gym for seven days.</> : <>Get started with the right access.</>}</h2>
        {trialAvailable ? <><p className="mt-4 max-w-lg text-sm leading-7 text-ink-muted">Set up your gym workspace and explore the included features during your eligible trial.</p><ul className="my-6 grid gap-3 text-sm text-ink-muted"><li><Check className="mr-2 inline text-brand" size={16} aria-hidden="true" />One seven-day trial per eligible gym identity</li><li><Check className="mr-2 inline text-brand" size={16} aria-hidden="true" />Trial plan: {trialPlanName}</li><li><Check className="mr-2 inline text-brand" size={16} aria-hidden="true" />Paid access requires verified payment</li></ul><MarketingPrimaryAction trialAvailable /></> : <><p className="mt-4 max-w-lg text-sm leading-7 text-ink-muted">Public registration is currently closed. Sign in if you already have an account, or request access from Fitivo.</p><div className="mt-6"><MarketingPrimaryAction trialAvailable={false} /></div></>}
      </div>
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8"><div className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand"><ShieldCheck size={22} aria-hidden="true" /></div><h3 className="mt-5 text-lg font-semibold text-ink">Access stays clear</h3><p className="mt-2 text-sm leading-6 text-ink-muted">A selected plan does not activate paid access. Fitivo verifies external payment before an authorized Superadmin activates or renews a subscription.</p><div className="mt-5 border-t border-line pt-4 text-xs text-ink-subtle">Auto-renew is disabled. Renewal requires a verified payment.</div></div>
    </div>
  </MarketingSection>;
}

export default function MarketingHome({ plans, pricingAvailable, trialAvailable, trialPlanName }) {
  const faqItems = [
    ["What is Fitivo?", "Fitivo is a gym management workspace for member records, memberships, attendance, staff, payment history, reports, and multi-branch operations on supported plans."],
    ["Is there a free trial?", trialAvailable ? `Eligible new gym owners can receive a seven-day ${trialPlanName} trial while public registration is enabled. Paid access requires verified payment and Superadmin reconciliation.` : "Public registration is currently closed, so new trial sign-ups are unavailable. Contact Fitivo to request access if a support channel is configured."],
    ["How does payment work?", "Fitivo uses manual payment verification. Pay externally using the configured instructions, then an authorized Superadmin checks receipt and reconciles the invoice. A submitted reference alone does not activate paid access."],
    ["Can I change my plan?", "Request a plan change from your billing page. Your current subscription stays in place while the request is reviewed. A paid plan starts only after verified payment is reconciled."],
    ["What happens when a subscription expires?", "Subscription-protected gym operations become unavailable. Your records remain saved, and the owner can still view billing information and request renewal."],
    ["Is my gym data secure?", "Gym workspaces use role-based access and gym-scoped data access. Staff permissions depend on their assigned role."],
  ];

  return <main id="home" className="overflow-hidden bg-canvas text-ink">
    <MarketingNavigation trialAvailable={trialAvailable} />
    <section className="relative isolate overflow-hidden bg-ink text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_77%_42%,rgba(99,91,223,.36),transparent_43%)]" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 opacity-[.08] [background-image:linear-gradient(rgba(255,255,255,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.2)_1px,transparent_1px)] [background-size:56px_56px]" aria-hidden="true" />
      <div className="mx-auto grid max-w-7xl items-center gap-4 px-5 pb-12 pt-28 sm:px-8 md:grid-cols-[.82fr_1.18fr] md:pb-16 md:pt-32">
        <div className="relative z-10"><MarketingPill className="border-white/15 bg-white/5 text-indigo-100"><span className="size-1.5 rounded-full bg-brand" />A workspace for your gym</MarketingPill>
          <h1 className="mt-6 max-w-xl text-4xl leading-[1.08] font-bold tracking-[-.045em] sm:text-5xl lg:text-[3.7rem]">Your gym. <span className="text-indigo-300">One powerful platform.</span></h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">Manage members, memberships, attendance, payments, staff, and reports from one connected workspace.</p>
          <div className="mt-7 flex flex-wrap gap-3"><MarketingPrimaryAction trialAvailable={trialAvailable} className="min-h-12 px-5" /><a href="#how-it-works" className="inline-flex min-h-12 items-center justify-center rounded-input border border-white/20 px-5 text-sm font-semibold text-white hover:bg-white/5">See how it works<ArrowRight className="ml-2" size={15} aria-hidden="true" /></a></div>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-300"><span><Check className="mr-1 inline text-indigo-300" size={14} aria-hidden="true" />Member and membership records</span><span><Check className="mr-1 inline text-indigo-300" size={14} aria-hidden="true" />Role-based team access</span></div>
        </div>
        <div className="relative"><div className="absolute inset-10 rounded-full bg-brand/30 blur-3xl" aria-hidden="true" /><div className="relative rotate-[.5deg]"><MarketingProductShowcase /></div></div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 border-t border-white/10 px-5 py-5 text-[10px] tracking-wide text-indigo-100/80 sm:px-8"><span>Designed around everyday gym operations</span><span>MEMBERS · ATTENDANCE · PAYMENTS · REPORTS</span></div>
    </section>

    <MarketingSection spacing={false} className="border-b border-line bg-surface px-5 py-6" containerClassName="flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 text-xs font-medium text-ink-muted sm:justify-between">{[[Users, "Members"], [CalendarCheck2, "Memberships"], [Activity, "Attendance"], [CreditCard, "Payments"], [ChartNoAxesColumn, "Reports"]].map(([Icon, label]) => <span className="flex items-center gap-2" key={label}><Icon size={16} className="text-brand" aria-hidden="true" />{label}</span>)}</MarketingSection>

    <MarketingSection id="features">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-brand">One workspace. Less busywork.</p><h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">The everyday work of running a gym, connected.</h2></div><p className="max-w-sm text-sm leading-6 text-ink-muted">Keep your team and member operations moving with clearer records and fewer disconnected tools.</p></div>
      <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{features.map(({ icon: Icon, title, text, tier }, index) => <article key={title} className={`rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-brand-muted hover:shadow-sm ${index < 2 ? "lg:col-span-2 lg:flex lg:items-start lg:gap-5" : ""}`}><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Icon size={20} aria-hidden="true" /></span><div className={index < 2 ? "mt-4 lg:mt-0" : ""}><h3 className="text-sm font-semibold text-ink">{title}</h3><p className="mt-2 text-xs leading-5 text-ink-muted">{text}</p><span className="mt-4 inline-flex rounded-pill bg-canvas px-2.5 py-1 text-[9px] font-medium text-ink-subtle">{tier}</span></div></article>)}</div>
    </MarketingSection>

    <MarketingSection id="how-it-works" className="bg-surface">
      <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[.16em] text-brand">A straightforward start</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">From setup to a steadier rhythm.</h2><p className="mt-3 text-sm leading-6 text-ink-muted">Bring your gym operations into a shared workspace at a pace that works for your team.</p></div>
      <ol className="mt-10 grid gap-4 md:grid-cols-3">{[["01", "Set up your workspace", "Create your gym profile and choose access that fits your operation."], ["02", "Bring your operations together", "Organize members, memberships, staff, attendance, and payment records."], ["03", "Review and grow", "Use clear activity and reports to guide your day-to-day decisions."]].map(([number, title, copy]) => <li key={number} className="relative rounded-2xl border border-line bg-canvas p-6"><span className="text-xs font-bold tracking-widest text-brand">{number}</span><h3 className="mt-5 text-base font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-ink-muted">{copy}</p>{number !== "03" && <span className="absolute -right-3 top-1/2 z-10 hidden size-6 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface text-ink-subtle md:grid"><ArrowRight size={12} /></span>}</li>)}</ol>
    </MarketingSection>

    <MarketingSection className="bg-canvas">
      <div className="mb-8 max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-brand">A closer look</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">The details that keep your gym moving.</h2><p className="mt-3 text-sm leading-6 text-ink-muted">Explore illustrative product views. All names and figures shown are sample data.</p></div>
      <MarketingProductShowcase />
    </MarketingSection>

    <MarketingSection id="pricing" className="bg-surface">
      <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[.16em] text-brand">Plans and pricing</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Choose the plan for your next step.</h2><p className="mt-3 text-sm leading-6 text-ink-muted">Plan limits and features are shown as configured. Paid subscriptions activate only after verified payment and authorized reconciliation.</p></div>
      {pricingAvailable && plans.length > 0 ? <><div className="mt-10 grid items-stretch gap-4 md:grid-cols-3">{plans.map((plan) => <PlanCard key={plan.id} plan={plan} trialAvailable={trialAvailable} />)}</div><div className="mt-10 overflow-x-auto rounded-2xl border border-line"><table className="w-full min-w-[620px] border-collapse text-left text-xs"><caption className="sr-only">Compare Fitivo plan features</caption><thead className="bg-canvas"><tr><th className="p-4 font-semibold">Included capabilities</th>{plans.map((plan) => <th key={plan.id} className="p-4 font-semibold">{plan.name}</th>)}</tr></thead><tbody>{coreFeatures.map((key) => <tr key={key} className="border-t border-line"><th className="p-4 font-medium text-ink-muted">{FEATURE_LABELS[key] || key}</th>{plans.map((plan) => <td key={plan.id} className="p-4 text-ink-muted">{plan.features?.[key] ? <span className="text-brand">Included</span> : "—"}</td>)}</tr>)}</tbody></table></div></> : <div role="status" className="mx-auto mt-8 max-w-xl rounded-2xl border border-line bg-canvas p-6 text-center"><h3 className="font-semibold">Plan pricing is temporarily unavailable</h3><p className="mt-2 text-sm text-ink-muted">Please check again later or sign in to view your billing options.</p><Link className="mt-4 inline-flex text-sm font-semibold text-brand" href="/login">Log in<ArrowRight className="ml-2" size={14} /></Link></div>}
    </MarketingSection>

    <TrialSection trialAvailable={trialAvailable} trialPlanName={trialPlanName} />

    <MarketingSection id="faq">
      <div className="grid gap-10 md:grid-cols-[.7fr_1.3fr]"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-brand">Good questions</p><h2 className="mt-3 text-3xl font-bold tracking-tight">Before you get started.</h2><p className="mt-4 max-w-xs text-sm leading-6 text-ink-muted">Clear answers about plans, access, and how Fitivo handles payments.</p></div><div className="divide-y divide-line border-y border-line">{faqItems.map(([question, answer], index) => <details key={question} open={index === 0} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">{question}<span className="grid size-6 shrink-0 place-items-center rounded-full border border-line text-brand transition group-open:rotate-45">+</span></summary><p className="mt-3 max-w-2xl pr-8 text-sm leading-6 text-ink-muted">{answer}</p></details>)}</div></div>
    </MarketingSection>

    <section className="bg-ink px-5 py-12 text-white"><div className="mx-auto flex max-w-6xl flex-col justify-between gap-7 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-indigo-200">Bring your work together</p><h2 className="mt-3 max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">A clearer workspace for the gym you’re building.</h2><p className="mt-2 text-sm text-slate-300">Members, attendance, payments, and reports in one place.</p></div><div className="flex flex-wrap items-center gap-4"><MarketingPrimaryAction trialAvailable={trialAvailable} className="bg-white text-ink hover:bg-slate-100" /><Link href="/login" className="text-sm font-semibold text-white/80 hover:text-white">Log in</Link></div></div></section>
    <MarketingFooter trialAvailable={trialAvailable} />
  </main>;
}
