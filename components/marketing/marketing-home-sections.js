import { ArrowDown, ArrowRight, CalendarCheck, CreditCard, FileChartColumn, Receipt, Users, WalletCards } from "lucide-react";
import MarketingContainer from "./marketing-container.js";
import { MarketingHeading } from "./marketing-primitives.js";
import { ProductCrop, StoryLink, StorySection } from "./marketing-story.js";

const capabilities = [[Users, "Members"], [WalletCards, "Memberships"], [CreditCard, "Payments"], [CalendarCheck, "Attendance"], [FileChartColumn, "Reports"]];
const workflow = [
  [Users, "Member", "Start with one member record."],
  [WalletCards, "Membership", "Connect the plan, term and renewal."],
  [Receipt, "Payment", "Follow recorded payments and dues."],
  [CalendarCheck, "Attendance", "Keep visits linked to the member."],
];

export function CapabilityStrip() {
  return <div id="features" className="scroll-mt-28 border-b border-slate-200 bg-white py-6"><MarketingContainer><ul aria-label="Fitivo capabilities" className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4 sm:justify-between">{capabilities.map(([Icon, label]) => <li key={label} className="flex items-center gap-2 text-sm font-medium text-slate-600"><Icon size={18} strokeWidth={1.6} aria-hidden="true" className="text-indigo-600" />{label}</li>)}</ul></MarketingContainer></div>;
}

export function ConnectedWorkflow() {
  return <StorySection id="connected-day"><div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
    <div><MarketingHeading eyebrow="CONNECTED WORKFLOW" title="One member. One connected history.">A renewal, a payment and a visit all start with the same person. Keep those records connected, so your team spends less time matching entries across registers and spreadsheets.</MarketingHeading><div className="mt-6"><StoryLink href="/features">Explore the connected workspace</StoryLink></div></div>
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8"><p className="mb-6 text-xs font-semibold uppercase tracking-widest text-slate-500">How the records connect</p><ol>{workflow.map(([Icon, title, description], index) => <li key={title}>
      <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl border border-indigo-100 bg-white text-indigo-600"><Icon size={20} aria-hidden="true" /></span><div><h3 className="font-semibold text-slate-900">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{description}</p></div></div>
      {index < workflow.length - 1 && <ArrowDown size={16} aria-hidden="true" className="my-3 ml-3.5 text-slate-300" />}
    </li>)}</ol></div>
  </div></StorySection>;
}

export function MembershipPayments() {
  return <StorySection id="fees-finance" className="border-y border-slate-200/70 bg-slate-50">
    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><MarketingHeading eyebrow="MEMBERSHIPS & PAYMENTS" title="Keep memberships and payments in sync.">Follow each membership from its agreed term to the next renewal. Record payments against the member’s balance, including partial payments, and keep dues and receipts easy to find.</MarketingHeading><StoryLink href="/features#fees">Explore fees & finance</StoryLink></div>
    <ProductCrop className="mt-10" src="/home-payments.webp" width={1535} height={365} alt="Fitivo payments overview showing collection totals, dues and payment search filters in an empty-state capture." caption="Real Fitivo payments interface · Empty-state overview; member and account details excluded." />
    <dl className="mt-9 grid gap-6 md:grid-cols-3 md:gap-8">{[["01", "Membership terms", "Keep plan details, expiry dates and renewals attached to the member."], ["02", "Recorded payments", "Record full or partial payments and follow the remaining dues."], ["03", "Receipt history", "Find the receipt behind a recorded payment when a member asks."]].map(([number, title, text]) => <div key={title} className="border-t border-slate-200 pt-5"><dt className="flex items-center gap-3 font-semibold text-slate-900"><span className="text-xs text-indigo-600">{number}</span>{title}</dt><dd className="mt-3 text-sm leading-6 text-slate-600">{text}</dd></div>)}</dl>
  </StorySection>;
}

export function AttendanceStory() {
  return <StorySection id="attendance"><div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-start lg:gap-20"><MarketingHeading eyebrow="THE EVERYDAY CHECK-IN" title="Every visit, connected to the member.">Find a member, record their check-in and check-out, and return to their attendance history when you need context. A clear routine for the front desk, with visits attached to the right record.</MarketingHeading><ol className="divide-y divide-slate-200">{["Search by member name or phone", "Record check-in and check-out", "Review member-linked visit history"].map((text, index) => <li key={text} className="flex items-center gap-4 py-4 text-sm font-medium text-slate-700"><span className="text-xs text-indigo-600">0{index + 1}</span>{text}<ArrowRight size={16} aria-hidden="true" className="ml-auto shrink-0 text-slate-400" /></li>)}</ol></div>
    <ProductCrop className="mt-10" src="/home-check-in.webp" width={1535} height={185} alt="Real Fitivo member check-in search with a field for member name or phone number." caption="The member check-in interface · A focused crop of the real attendance screen." />
  </StorySection>;
}

export function OwnerVisibility() {
  return <StorySection id="reports" className="bg-slate-50"><div className="grid gap-10 lg:grid-cols-2 lg:gap-20"><div><MarketingHeading eyebrow="OWNER VISIBILITY" title="See the records behind your gym.">Review recorded collections, membership information and attendance activity. Choose a reporting period to understand the records your team has entered.</MarketingHeading><div className="mt-5"><StoryLink href="/features#reports">Explore reporting</StoryLink></div></div><div className="space-y-6">{[["Collections", "Review recorded member payments across a selected period."], ["Memberships", "See member registrations and current membership information."], ["Attendance", "Review visits and attendance activity across your gym."]].map(([title, text]) => <div key={title} className="border-l-2 border-indigo-200 pl-5"><h3 className="font-semibold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div>)}</div></div>
    <ProductCrop className="mt-10" src="/home-report-filters.webp" width={1535} height={125} alt="Fitivo report period controls, from the last seven days to a custom period, with a monthly chart interval." caption="Real report period controls · Report access and advanced capabilities depend on your plan and permissions." />
  </StorySection>;
}
