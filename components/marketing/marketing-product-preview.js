import { Activity, ArrowUpRight, Building2, CalendarCheck2, ChartNoAxesCombined, ChevronDown, CreditCard, LayoutDashboard, Plus, Search, Settings, Users, Zap } from "lucide-react";
import Card from "../ui/card.js";
import StatCard from "../ui/stat-card.js";
import StatusPill from "../ui/status-pill.js";
import { MarketingPreviewCard } from "./marketing-primitives.js";
import styles from "./marketing.module.css";

// Deliberately static demonstration data. No tenant data or protected API calls.
const navigation = [["overview", "Dashboard", LayoutDashboard], ["members", "Members", Users], ["renewals", "Memberships", CalendarCheck2], ["attendance", "Attendance", Activity], ["payments", "Payments", CreditCard], ["reports", "Reports", ChartNoAxesCombined], ["branches", "Branches", Building2]];
const sampleMembers = [
  { name: "Ayesha Khan", initials: "AK", plan: "Monthly", date: "28 Oct", status: "Active" },
  { name: "Omar Ahmed", initials: "OA", plan: "Quarterly", date: "29 Oct", status: "Expiring" },
  { name: "Sara Ali", initials: "SA", plan: "Monthly", date: "30 Oct", status: "Active" },
];
const panels = {
  overview: { title: "Dashboard", subtitle: "A little clarity for your busy day.", stats: [["Active members", "248", Users], ["Today's check-ins", "86", Activity], ["Monthly collections", "PKR 84,250", CreditCard]] },
  members: { title: "Members", subtitle: "Every member. Every detail. In one place.", stats: [["Active members", "248", Users], ["New this month", "24", Plus], ["Expiring soon", "12", CalendarCheck2]] },
  renewals: { title: "Memberships", subtitle: "Know who is due for their next chapter.", stats: [["Active memberships", "236", Users], ["Expiring soon", "12", CalendarCheck2], ["Renewed this month", "42", Activity]] },
  attendance: { title: "Attendance", subtitle: "Keep a clear record of every visit.", stats: [["Today's check-ins", "86", Activity], ["This week", "524", CalendarCheck2], ["Members checked in", "192", Users]] },
  payments: { title: "Payments", subtitle: "Collections, balances, and receipts together.", stats: [["Collected this month", "PKR 84,250", CreditCard], ["Outstanding dues", "PKR 12,000", Users], ["Payments recorded", "42", Activity]] },
  reports: { title: "Reports & analytics", subtitle: "Turn everyday activity into a clearer picture.", stats: [["Monthly check-ins", "2,416", Activity], ["Monthly collections", "PKR 84,250", CreditCard], ["Renewals", "42", CalendarCheck2]] },
  branches: { title: "Branches", subtitle: "One organization. A connected operation.", stats: [["Active branches", "3", Building2], ["Active members", "748", Users], ["Staff accounts", "18", Activity]] },
};

export function MemberPreview({ renewals = false }) {
  return <Card className={styles.memberPreview}>
    <div className={styles.miniHeading}><div><span className={styles.previewIcon}><Users size={16} /></span><strong>{renewals ? "Upcoming renewals" : "Member directory"}</strong></div><span className={styles.miniLabel}>SAMPLE DATA</span></div>
    <div className={styles.memberTable} role="table" aria-label={renewals ? "Sample upcoming renewals" : "Sample member directory"}>
      <div className={styles.memberTableHead} role="row"><span role="columnheader">Member</span><span role="columnheader">{renewals ? "Expires" : "Plan"}</span><span role="columnheader">Status</span></div>
      {sampleMembers.map((member, index) => <div className={styles.memberRow} role="row" key={member.name}><span className={styles.memberName} role="cell"><span className={styles.memberAvatar} data-tone={index} aria-hidden="true">{member.initials}</span><span><strong>{member.name}</strong><small>Member #{String(index + 1).padStart(3, "0")}</small></span></span><span role="cell">{renewals ? member.date : member.plan}</span><span role="cell"><StatusPill status={member.status} /></span></div>)}
    </div>
  </Card>;
}

export function BranchPreview() {
  return <div className={styles.branchPreview}>
    <div className={styles.branchPreviewTop}><span className={styles.branchSymbol}><Building2 size={22} /></span><div><strong>Your gym organization</strong><small>One workspace. Connected locations.</small></div><span className={styles.branchDemo}>DEMO</span></div>
    <div className={styles.branchConnections} aria-hidden="true"><span /><span /><span /></div>
    <div className={styles.branchLocations}>{[["Main branch", "348"], ["North branch", "216"], ["West branch", "184"]].map(([name, count], i) => <div key={name}><Building2 size={20} /><strong>{name}</strong><span>{count} members</span><small><i />{i === 0 ? "Main location" : "Active branch"}</small></div>)}</div>
    <div className={styles.branchPreviewBottom}><span><Users size={14} /> 748 members across locations</span><span>Sample data</span></div>
  </div>;
}

function ActivityChart({ attendance = false }) {
  return <Card className={styles.chartCard}>
    <div className={styles.chartTitle}><div><h4>{attendance ? "Weekly attendance" : "Collection activity"}</h4><p>{attendance ? "Check-ins across the week" : "Member payments · PKR"}</p></div><span>Last 7 days <ChevronDown size={11} /></span></div>
    <div className={styles.chart} role="img" aria-label={attendance ? "Sample check-ins: Monday 54, Tuesday 72, Wednesday 63, Thursday 86, Friday 71, Saturday 96, Sunday 82." : "Sample collections, Monday to Sunday: PKR 5,400, 7,200, 6,300, 8,600, 7,100, 9,600, 8,200."}>
      <div className={styles.chartAxis} aria-hidden="true">{(attendance ? ["100", "75", "50", "25"] : ["10k", "7.5k", "5k", "2.5k"]).map((value) => <span key={value}>{value}</span>)}</div>
      <div className={styles.chartBars} aria-hidden="true">{[54, 72, 63, 86, 71, 96, 82].map((value, i) => <div key={i}><span style={{ height: `${value}%` }} className={i === 5 ? styles.barHighlight : ""} /><small>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}</small></div>)}</div>
    </div>
  </Card>;
}

export default function MarketingProductPreview({ kind = "overview", compact = false }) {
  const panel = panels[kind] || panels.overview;
  return <MarketingPreviewCard title="Fitivo / Gym owner workspace" className={`${styles.productPreview} ${compact ? styles.compactPreview : ""}`}>
    <div className={styles.previewShell}>
      <aside className={styles.previewSidebar} aria-label="Illustrative workspace sidebar">
        <div className={styles.previewBrand}><span><Zap size={16} /></span>Fitivo.</div>
        <div className={styles.previewGym}><span>Y</span><div><strong>Your gym</strong><small>Owner workspace</small></div><ChevronDown size={12} /></div>
        <span className={styles.sidebarLabel}>WORKSPACE</span>
        {navigation.map(([id, label, Icon]) => <div className={`${styles.previewNavItem} ${kind === id ? styles.previewNavActive : ""}`} key={id}><Icon size={14} /><span>{label}</span></div>)}
        <div className={styles.previewSidebarBottom}><Settings size={14} /> Settings</div>
      </aside>
      <div className={styles.previewMain}>
        <div className={styles.previewToolbar}><span>Workspace <span>/</span> {panel.title}</span><span className={styles.toolbarRight}><Search size={14} /><span className={styles.ownerAvatar}>YO</span></span></div>
        <div className={styles.previewContent}>
          <div className={styles.dashboardHeading}><div><h3>{panel.title}</h3><p>{panel.subtitle}</p></div><span className={styles.previewAdd}><Plus size={13} /> Add member</span></div>
          <div className={styles.previewStats}>{panel.stats.map(([label, value, Icon]) => <StatCard key={label} label={label} value={value} icon={<Icon size={15} />} className={styles.previewStat} />)}</div>
          {kind === "branches" ? <BranchPreview /> : kind === "members" || kind === "renewals" ? <div className={styles.previewTableArea}><MemberPreview renewals={kind === "renewals"} /></div> : <div className={styles.previewPanels}><ActivityChart attendance={kind === "attendance"} /><Card className={styles.renewalCard}><div className={styles.miniHeading}><strong>Renewals ahead</strong><CalendarCheck2 size={15} /></div><p className={styles.renewalNumber}>12<span>members expiring soon</span></p><div className={styles.renewalTrack} aria-hidden="true"><span /></div><p className={styles.renewalHint}>A good moment to reconnect.</p><div className={styles.renewalMember}><span className={styles.memberAvatar}>OA</span><div><strong>Omar Ahmed</strong><small>Quarterly membership</small></div><ArrowUpRight size={14} /></div></Card></div>}
          {!compact && <div className={styles.previewBottomNote}><span><span className={styles.statusDot} /> Your daily operations, connected</span><span>Illustrative product view</span></div>}
        </div>
      </div>
    </div>
  </MarketingPreviewCard>;
}
