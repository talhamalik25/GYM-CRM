import { Activity, CalendarDays, CreditCard, Users } from "lucide-react";
import { MarketingPreviewCard } from "./marketing-primitives.js";

const panels = {
  overview: { title: "Workspace overview", eyebrow: "Good morning, Gym Owner", stats: [["Members", "1,248", Users], ["Check-ins", "86", Activity], ["Collections", "PKR 84,250", CreditCard]], chart: "Gym activity" },
  members: { title: "Member directory", eyebrow: "Your people, organized", stats: [["Active", "1,248", Users], ["Renewals due", "24", CalendarDays], ["New this month", "42", Activity]], chart: "Membership activity" },
  attendance: { title: "Attendance", eyebrow: "Daily check-ins", stats: [["Today", "86", Activity], ["This week", "524", CalendarDays], ["Peak hour", "6–7 PM", Users]], chart: "Weekly check-ins" },
  payments: { title: "Payments", eyebrow: "A clearer view of collections", stats: [["Collected", "PKR 842,500", CreditCard], ["Outstanding", "PKR 64,000", Users], ["Recorded", "186", Activity]], chart: "Collection activity" },
  reports: { title: "Reports & insights", eyebrow: "Understand the rhythm of your gym", stats: [["Attendance", "2,416", Activity], ["Collections", "PKR 842,500", CreditCard], ["Renewals", "124", CalendarDays]], chart: "Monthly activity" },
};

export default function MarketingProductPreview({ kind = "overview", compact = false }) {
  const panel = panels[kind] || panels.overview;
  return <MarketingPreviewCard title="Gym workspace" className={compact ? "shadow-none" : "shadow-xl shadow-ink/10"}>
    <div className={`grid ${compact ? "min-h-[265px] grid-cols-[84px_1fr]" : "min-h-[350px] grid-cols-[112px_1fr] sm:grid-cols-[150px_1fr]"} overflow-hidden bg-canvas text-ink`}>
      <aside className="flex flex-col border-r border-line bg-surface p-3">
        <div className="mb-6 text-xs font-bold tracking-tight text-ink">Fitivo</div>
        <span className="mb-2 text-[7px] font-bold tracking-widest text-ink-subtle">WORKSPACE</span>
        {["Overview", "Members", "Attendance", "Payments", "Reports"].map((item, index) => <div key={item} className={`rounded-md px-2 py-2 text-[8px] ${index === (kind === "members" ? 1 : kind === "attendance" ? 2 : kind === "payments" ? 3 : kind === "reports" ? 4 : 0) ? "bg-brand-soft font-semibold text-brand-soft-text" : "text-ink-muted"}`}>{item}</div>)}
      </aside>
      <div className="min-w-0 p-3 sm:p-5">
        <div className="flex justify-between border-b border-line pb-3 text-[8px] text-ink-muted"><span>{panel.title}</span><span>Today⌄</span></div>
        <div className="py-4"><span className="text-[7px] font-bold uppercase tracking-widest text-brand">{panel.eyebrow}</span><h3 className="mt-1 text-sm font-semibold sm:text-base">Your gym, at a glance.</h3></div>
        <div className="grid grid-cols-3 gap-2">{panel.stats.map(([label, value, Icon]) => <div key={label} className="min-w-0 rounded-lg border border-line bg-surface p-2"><span className="flex items-center gap-1 text-[7px] text-ink-muted"><Icon size={10} aria-hidden="true" />{label}</span><b className="mt-2 block truncate text-[10px] sm:text-sm">{value}</b></div>)}</div>
        <div className="mt-3 rounded-lg border border-line bg-surface p-3"><div className="flex justify-between text-[8px]"><b>{panel.chart}</b><span className="text-ink-subtle">Last 7 days</span></div><div className="mt-3 flex h-20 items-end justify-around border-b border-line bg-[linear-gradient(to_bottom,transparent_32%,#eef0f5_33%,transparent_34%,transparent_65%,#eef0f5_66%,transparent_67%)]">{[34, 58, 45, 75, 62, 91, 69].map((height, index) => <span key={index} style={{ height: `${height}%` }} className={`w-[8%] rounded-t ${index === 5 ? "bg-brand" : "bg-brand-muted"}`} />)}</div><div className="mt-1 flex justify-around text-[7px] text-ink-subtle">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}</div></div>
      </div>
    </div>
  </MarketingPreviewCard>;
}
