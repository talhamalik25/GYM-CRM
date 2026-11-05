import { ArrowRight, CalendarCheck, CreditCard, FileChartColumn, Receipt, Users, WalletCards } from "lucide-react";
import MarketingContainer from "./marketing-container.js";
import { ProductCrop, StoryHeading, StoryLink, StorySection } from "./marketing-story.js";

const capabilities = [[Users, "Members"], [WalletCards, "Memberships"], [CreditCard, "Payments"], [CalendarCheck, "Attendance"], [FileChartColumn, "Reports"]];
const workflow = [["Member", "One record to start from."], ["Membership", "The plan, term and renewal."], ["Payment", "Recorded payments and dues."], ["Attendance", "Visits linked to the member."]];

export function CapabilityStrip() {
  return <div id="features" className="scroll-mt-28 border-y border-slate-200 bg-white py-7"><MarketingContainer className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><p className="text-center text-sm font-medium leading-6 text-slate-900 lg:text-left">One connected<br className="hidden lg:block" /> gym system.</p><ul aria-label="Fitivo capabilities" className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4 lg:gap-9">{capabilities.map(([Icon, label]) => <li key={label} className="flex items-center gap-2 text-xs font-medium text-slate-600 sm:text-sm"><Icon size={18} strokeWidth={1.5} aria-hidden="true" className="text-slate-400" />{label}</li>)}</ul></MarketingContainer></div>;
}

export function ConnectedWorkflow() {
  return <StorySection id="connected-day">
    <div className="grid gap-7 lg:grid-cols-[1.3fr_0.8fr] lg:items-end lg:gap-20"><StoryHeading eyebrow="GYM OPERATIONS, BETTER CONNECTED" title={<>Running a gym is busy.<br /><span className="text-indigo-600">The system shouldn’t be.</span></>} /><p className="text-base leading-8 text-slate-500 sm:text-[17px]">Scattered member records. Separate attendance registers. Payment notes to reconcile. Keep the work connected, so your team can find the context behind each member.</p></div>
    <div className="mt-12 grid overflow-hidden rounded-2xl border border-slate-200 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="bg-slate-50 p-6 sm:p-10"><p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">The disconnected day</p><ul className="mt-7 space-y-5">{["Member details in one register", "Payment notes in another", "Visits and expiry follow-ups to trace"].map(text => <li key={text} className="flex items-center gap-3 text-sm leading-6 text-slate-600"><span className="size-1 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />{text}</li>)}</ul><p className="mt-8 border-t border-slate-200 pt-5 text-xs text-slate-500">Different records. More places to look.</p></div>
      <div className="bg-white p-6 sm:p-10"><p className="text-xl font-semibold tracking-tight text-slate-900">One connected gym workspace.</p><ol className="mt-7 grid gap-3 sm:grid-cols-4 sm:gap-4">{workflow.map(([title, text], index) => <li key={title}><div className="flex items-center justify-between"><span className="text-xs font-medium text-indigo-600">0{index + 1}</span>{index < 3 && <ArrowRight size={14} aria-hidden="true" className="hidden text-slate-300 sm:block" />}</div><h3 className="mt-2 text-sm font-semibold text-slate-900">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{text}</p></li>)}</ol><div className="mt-7"><StoryLink href="/features">See how the records connect</StoryLink></div></div>
    </div>
  </StorySection>;
}

export function MemberStory() {
  return <StorySection id="member-workflow" className="bg-slate-50">
    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><StoryHeading eyebrow="ONE WORKSPACE. NOT A PILE OF TOOLS." title={<>Built around members.<br />Connected through operations.</>} /><StoryLink href="/features#member-management">Explore member management</StoryLink></div>
    <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
      <article className="border-t border-slate-300 pt-7"><div className="flex items-center gap-3 text-xs text-slate-500"><Users size={18} aria-hidden="true" /> MEMBER MANAGEMENT</div><h3 className="mt-6 text-3xl font-medium leading-tight tracking-tight sm:text-4xl">Every member.<br />A complete picture.</h3><p className="mt-5 max-w-lg text-base leading-8 text-slate-500">Member details, memberships, recorded payments and attendance stay connected around one record. Find the person first, then follow their history.</p><ul className="mt-7 flex flex-wrap gap-x-5 gap-y-3 border-t border-slate-200 pt-5 text-xs text-slate-600">{["Member details", "Membership history", "Payment records", "Visits"].map(text => <li key={text}>{text}</li>)}</ul></article>
      <article className="border-t border-slate-300 pt-7"><div className="flex items-center gap-3 text-xs text-slate-500"><WalletCards size={18} aria-hidden="true" /> MEMBERSHIPS</div><h3 className="mt-6 text-3xl font-medium leading-tight tracking-tight sm:text-4xl">From joining<br />to renewal.</h3><p className="mt-5 text-base leading-8 text-slate-500">Keep the chosen plan, membership term and expiry date together. Record each renewal without losing the context of earlier terms and payments.</p><div className="mt-5"><StoryLink href="/features#memberships">Explore memberships</StoryLink></div></article>
    </div>
  </StorySection>;
}

export function MembershipPayments() {
  return <StorySection id="fees-finance" className="bg-slate-900 text-white">
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-16"><StoryHeading inverse eyebrow="MEMBERSHIPS & PAYMENTS" title={<>Know what’s active.<br />Know what needs attention.</>} /><div><p className="text-base leading-8 text-slate-300">Membership terms, recorded payments, partial payments and dues belong in the same conversation. Keep them connected to the member, with a receipt behind each recorded payment.</p><div className="mt-5"><StoryLink inverse href="/features#fees">Inside fees & finance</StoryLink></div></div></div>
    <ProductCrop inverse className="mt-12" label="Payments workspace" src="/home-payments.webp" width={1535} height={365} alt="Fitivo payments overview with collection totals, dues and payment search filters in an empty-state capture." caption="Real Fitivo payments interface · Empty-state preview." />
    <ul className="mt-8 grid gap-5 border-t border-white/15 pt-7 sm:grid-cols-2 lg:grid-cols-4">{["Membership records & renewals", "Payment history & receipts", "Outstanding dues", "Recorded collection reporting"].map(text => <li key={text} className="flex items-center gap-3 text-sm text-slate-200"><Receipt size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-slate-400" />{text}</li>)}</ul>
  </StorySection>;
}

export function AttendanceStory() {
  return <StorySection id="attendance"><div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
    <div><StoryHeading eyebrow="DAILY ATTENDANCE" title={<>Know who’s<br />showing up.</>}>Find a member, record their check-in and check-out, and return to their attendance history. Every visit stays linked to the person behind it.</StoryHeading><ol className="mt-7 divide-y divide-slate-200">{["Search by member name or phone", "Record check-in and check-out", "Review member-linked visit history"].map((text, index) => <li key={text} className="flex items-center gap-4 py-4 text-sm text-slate-600"><span className="text-xs text-slate-400">0{index + 1}</span>{text}</li>)}</ol></div>
    <div className="min-w-0 rounded-2xl bg-slate-50 px-4 py-8 sm:p-8 lg:py-16"><ProductCrop label="Member check-in" src="/home-check-in.webp" width={1535} height={185} alt="Fitivo member check-in search with a field for member name or phone number." caption="Find the member. Record the visit." /><div className="mt-7 flex items-center gap-3 text-sm text-slate-500"><CalendarCheck size={18} aria-hidden="true" />Every visit, connected to the member.</div></div>
  </div></StorySection>;
}

export function OwnerVisibility() {
  return <StorySection id="reports" className="bg-slate-50"><div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20"><div><StoryHeading eyebrow="OWNER VISIBILITY" title={<>The numbers.<br />And the activity behind them.</>}>Review membership information, recorded collections and attendance activity. Follow the operational records your team maintains, with reporting that reflects your plan and permissions.</StoryHeading><div className="mt-5"><StoryLink href="/features#reports">Explore reporting</StoryLink></div></div><dl className="divide-y divide-slate-200">{[["Collections", "Review recorded member payments across a selected period."], ["Memberships", "See member registrations and current membership information."], ["Attendance", "Review visits and attendance activity across your gym."]].map(([title, text], index) => <div key={title} className="py-6 first:pt-0"><dt className="flex gap-4 text-lg font-medium text-slate-900"><span className="pt-1 text-xs text-slate-400">0{index + 1}</span>{title}</dt><dd className="mt-3 pl-8 text-sm leading-7 text-slate-500">{text}</dd></div>)}</dl></div>
    <ProductCrop className="mt-12" label="Reporting periods" src="/home-report-filters.webp" width={1535} height={125} alt="Fitivo report period controls with preset and custom periods and a monthly chart interval." caption="Real report controls · Choose the period you want to review." />
  </StorySection>;
}
