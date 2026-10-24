"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, ArrowUpRight, CalendarCheck2, Check, ChartNoAxesColumn, CreditCard, Dumbbell, Menu, ShieldCheck, Users, WalletCards, X, Zap } from "lucide-react";
import { FEATURE_LABELS } from "../../lib/saasPlanRules.js";

const featureCards = [
  { icon: Users, title: "Know every member", body: "Keep member profiles, contact details, membership status, and account history together.", availability: "Every plan" },
  { icon: CalendarCheck2, title: "Stay ahead of renewals", body: "Create memberships, see upcoming expiries, and record renewals without losing history.", availability: "Every plan" },
  { icon: Activity, title: "See who is training", body: "Track check-ins and attendance with a clear view of activity across your gym.", availability: "Every plan" },
  { icon: CreditCard, title: "Keep payments organized", body: "Record payments against memberships and review balances, receipts, and payment history.", availability: "Every plan" },
  { icon: Dumbbell, title: "Coordinate your team", body: "Manage trainers and staff accounts with gym-scoped access and practical role controls.", availability: "Plan limits apply" },
  { icon: ChartNoAxesColumn, title: "Make decisions with reports", body: "Review gym activity, collections, attendance, and member trends from one workspace.", availability: "Advanced reports on Pro and Professional" },
  { icon: WalletCards, title: "Track your Fitivo plan", body: "View your SaaS subscription, invoices, renewal requests, and manual payment status.", availability: "Every plan" },
  { icon: Zap, title: "Grow across locations", body: "Bring branch activity and consolidated reporting into one organization view.", availability: "Professional" },
];

const showcaseItems = [
  { number: "01", eyebrow: "OWNER DASHBOARD", title: "A clearer view of your day", body: "Bring member totals, attendance, renewals, and collections into one focused overview.", variant: "overview" },
  { number: "02", eyebrow: "MEMBERS & ATTENDANCE", title: "Keep the floor moving", body: "Find member records quickly and see attendance activity without switching between tools.", variant: "members" },
  { number: "03", eyebrow: "REPORTS & BRANCHES", title: "Understand the bigger picture", body: "Review performance trends. Professional adds branch reports and consolidated analytics.", variant: "reports" },
];

const faqItems = [
  { q: "What is Fitivo?", a: "Fitivo is a gym management workspace for member records, memberships, attendance, staff, payment history, reports, and—on Professional—multi-branch operations." },
  { q: "Is there a free trial?", a: "Eligible new gym owners can receive one seven-day trial when public registration is enabled. Trial access ends after seven days; paid access requires a verified payment and Superadmin reconciliation." },
  { q: "Can I manage multiple gym branches?", a: "Professional includes multi-branch management, branch reports, and consolidated analytics. Basic and Pro are configured for one branch." },
  { q: "How does payment work?", a: "Fitivo uses manual payment verification. Pay externally using the instructions provided by Fitivo, then an authorized Superadmin checks receipt and reconciles the invoice. A submitted reference alone does not activate paid access." },
  { q: "Can I upgrade my plan?", a: "You can request a plan change from your billing page. The current subscription stays in place while Fitivo reviews the request and issues an invoice. The new plan starts only after verified payment is reconciled." },
  { q: "What happens when my subscription expires?", a: "Gym operations that require an active subscription become unavailable. Your records remain saved, and the owner can still view billing information and request renewal." },
  { q: "Is my gym data secure?", a: "Gym workspaces use role-based access and gym-scoped data access. Staff permissions depend on their assigned role. Do not share account credentials with anyone." },
];

function formatPrice(price) { return "PKR " + Number(price).toLocaleString("en-PK"); }
function intervalLabel(interval) { return interval === "yearly" ? "year" : "month"; }
function limitLabel(value, noun) { return value == null ? "Unlimited " + noun : Number(value).toLocaleString("en-PK") + " " + noun; }

function Brand({ footer = false }) {
  return <Link className={"fitivo-brand" + (footer ? " fitivo-brand-footer" : "")} href="/" aria-label="Fitivo home"><span className="fitivo-brand-mark"><Dumbbell size={17} strokeWidth={2.5} aria-hidden="true" /></span><span>fitivo</span></Link>;
}

function DashboardPreview() {
  return <div className="marketing-dashboard-wrap" aria-label="Illustrative Fitivo dashboard preview">
    <div className="marketing-dashboard-glow" aria-hidden="true" />
    <div className="marketing-dashboard">
      <aside className="marketing-dashboard-side">
        <div className="marketing-dashboard-logo"><span className="fitivo-brand-mark"><Dumbbell size={13} aria-hidden="true" /></span><b>fitivo</b></div>
        <span className="marketing-demo-label">DEMO WORKSPACE</span>
        <div className="marketing-side-item is-current"><Activity size={14} />Overview</div>
        <div className="marketing-side-item"><Users size={14} />Members</div>
        <div className="marketing-side-item"><CalendarCheck2 size={14} />Attendance</div>
        <div className="marketing-side-item"><CreditCard size={14} />Payments</div>
        <div className="marketing-side-item"><ChartNoAxesColumn size={14} />Reports</div>
        <div className="marketing-side-profile"><span>G</span><div><b>Gym workspace</b><small>Owner account</small></div></div>
      </aside>
      <div className="marketing-dashboard-main">
        <div className="marketing-dashboard-top"><span>Workspace overview</span><span className="marketing-dashboard-date">Today <span>⌄</span></span></div>
        <div className="marketing-dashboard-welcome"><div><small>MONDAY, OCTOBER 19</small><h3>Your gym, at a glance.</h3><p>Illustrative preview data</p></div><button type="button" aria-label="Demo notifications"><span /></button></div>
        <div className="marketing-stat-grid">
          <div className="marketing-stat"><span>Active members</span><strong>1,248</strong><small><i>↑ 8.2%</i> vs. last month</small><span className="marketing-stat-icon"><Users size={15} /></span></div>
          <div className="marketing-stat"><span>Today’s check-ins</span><strong>86</strong><small><i>↑ 12.4%</i> vs. last week</small><span className="marketing-stat-icon"><Activity size={15} /></span></div>
          <div className="marketing-stat"><span>Renewals due</span><strong>24</strong><small>in the next 7 days</small><span className="marketing-stat-icon"><CalendarCheck2 size={15} /></span></div>
        </div>
        <div className="marketing-dashboard-lower">
          <div className="marketing-chart-card"><div className="marketing-mini-heading"><div><b>Attendance activity</b><small>Check-ins this week</small></div><span>Last 7 days⌄</span></div><div className="marketing-chart"><div className="marketing-chart-grid"><i /><i /><i /></div><div className="marketing-chart-bars">{[38, 58, 46, 76, 63, 91, 70].map((height, index) => <span key={index} style={{ "--bar-height": height + "%" }} className={index === 5 ? "bar-highlight" : ""} />)}</div></div><div className="marketing-chart-days"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div>
          <div className="marketing-renewals-card"><div className="marketing-mini-heading"><div><b>Memberships</b><small>Recent activity</small></div><span>•••</span></div>{[{ initials: "AM", member: "Member 024", status: "Active", tone: "green" }, { initials: "SK", member: "Member 031", status: "Renewal due", tone: "amber" }, { initials: "FH", member: "Member 042", status: "Active", tone: "green" }].map((item) => <div className="marketing-member-row" key={item.member}><span className="marketing-avatar">{item.initials}</span><b>{item.member}</b><small className={"demo-pill " + item.tone}>{item.status}</small></div>)}</div>
        </div>
      </div>
    </div>
    <div className="marketing-preview-note"><span className="marketing-live-dot" /> Product preview · sample data</div>
  </div>;
}

function ProductMockup({ variant }) {
  if (variant === "members") return <div className="showcase-mockup members-mockup" aria-label="Illustrative member and attendance interface">
    <div className="mockup-window-bar"><span /><span /><span /><b>Members</b><small>+ Add member</small></div>
    <div className="mockup-toolbar"><strong>All members <em>1,248</em></strong><span>Search members…</span><span>Filter⌄</span></div>
    <div className="mockup-table"><div className="mockup-table-head"><span>MEMBER</span><span>PLAN</span><span>STATUS</span><span>RENEWAL</span></div>{[["Member 024", "Monthly", "Active", "Oct 28"], ["Member 031", "Annual", "Renewal due", "Oct 21"], ["Member 042", "Monthly", "Active", "Nov 04"], ["Member 057", "Quarterly", "Active", "Nov 12"]].map((row, index) => <div className="mockup-table-row" key={row[0]}><span><i className={"mockup-avatar avatar-" + index}>{["AM", "SK", "FH", "RA"][index]}</i>{row[0]}</span><span>{row[1]}</span><span><i className={"mockup-status status-" + (index === 1 ? "amber" : "green")} />{row[2]}</span><span>{row[3]}</span></div>)}</div>
  </div>;
  if (variant === "reports") return <div className="showcase-mockup report-mockup" aria-label="Illustrative gym reports dashboard">
    <div className="report-top"><div><small>ORGANIZATION PERFORMANCE</small><b>Reports & analytics</b></div><span>All branches⌄</span></div>
    <div className="report-metrics"><div><small>COLLECTIONS</small><b>PKR 842,500</b><em>Current month</em></div><div><small>ATTENDANCE</small><b>2,416</b><em>This month</em></div></div>
    <div className="report-chart-head\"><b>Branch activity</b><small>Illustrative preview data</small></div>
    <div className="report-chart-bars">{[{ name: "North", h: 67 }, { name: "Central", h: 84 }, { name: "West", h: 51 }].map((branch) => <div key={branch.name}><span style={{ "--branch-height": branch.h + "%" }} /><small>{branch.name}</small></div>)}</div>
    <div className="report-branch-badge"><span><Activity size={14} /></span><div><b>Consolidated view</b><small>Branch reporting · Professional</small></div><ArrowUpRight size={15} /></div>
  </div>;
  return <div className="showcase-mockup overview-mockup" aria-label="Illustrative owner dashboard overview">
    <div className="overview-head"><div><small>GYM DASHBOARD</small><b>Good morning, Gym Owner</b></div><span>Today⌄</span></div>
    <div className="overview-cards"><div><small>MEMBERS</small><b>1,248</b><em>Active</em></div><div><small>ATTENDANCE</small><b>86</b><em>Today</em></div><div><small>COLLECTIONS</small><b>PKR 84,250</b><em>This month</em></div></div>
    <div className="overview-graph"><div className="overview-graph-title"><b>Gym activity</b><small>Last 6 months</small></div><div className="overview-graph-lines"><i /><i /><i /></div><svg viewBox="0 0 500 145" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="marketing-chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#a5b4fc" stopOpacity=".5" /><stop offset="1" stopColor="#a5b4fc" stopOpacity="0" /></linearGradient></defs><path d="M0 112 C34 106 42 70 78 79 S123 106 157 71 S202 90 238 55 S289 71 322 42 S365 70 400 39 S453 53 500 14 L500 145 L0 145Z" fill="url(#marketing-chart-fill)" /><path d="M0 112 C34 106 42 70 78 79 S123 106 157 71 S202 90 238 55 S289 71 322 42 S365 70 400 39 S453 53 500 14" fill="none" stroke="#6366f1" strokeWidth="3" /></svg></div>
  </div>;
}

export default function MarketingHome({ plans, pricingAvailable, trialAvailable, trialPlanName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const elements = document.querySelectorAll(".marketing-reveal");
    if (!("IntersectionObserver" in window)) { elements.forEach((element) => element.classList.add("is-visible")); return; }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
    }), { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const trialHref = trialAvailable ? "/register" : "#trial";
  const navLinks = [["Features", "#features"], ["How it works", "#how-it-works"], ["Pricing", "#pricing"], ["FAQs", "#faq"]];
  return <main className="marketing-site">
    <header className="marketing-header"><div className="marketing-nav-shell"><Brand /><nav className={menuOpen ? "marketing-nav is-open" : "marketing-nav"} aria-label="Main navigation">{navLinks.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}<div className="marketing-mobile-actions"><Link className="marketing-login-link" href="/login">Log in</Link><Link className="marketing-nav-cta" href={trialHref} onClick={() => setMenuOpen(false)}>{trialAvailable ? "Start free trial" : "Trial details"}<ArrowRight size={15} /></Link></div></nav><div className="marketing-desktop-actions"><Link className="marketing-login-link" href="/login">Log in</Link><Link className="marketing-nav-cta" href={trialHref}>{trialAvailable ? "Start free trial" : "Explore trial"}<ArrowRight size={15} /></Link></div><button className="marketing-menu-button" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button></div></header>

    <section className="marketing-hero" id="home"><div className="marketing-hero-grid" aria-hidden="true" /><div className="marketing-container marketing-hero-inner"><div className="marketing-hero-copy marketing-reveal"><div className="marketing-eyebrow"><span className="marketing-eyebrow-dot" /> THE GYM OPERATING SYSTEM</div><h1>Run your gym<br />smarter. <span>Grow faster.</span></h1><p className="marketing-hero-lede">Manage members, memberships, attendance, payments, staff, and business performance—all from one powerful platform.</p><div className="marketing-hero-actions"><Link className="marketing-button marketing-button-primary" href={trialHref}>{trialAvailable ? "Start your 7-day free trial" : "Explore the 7-day trial"}<ArrowRight size={17} /></Link><a className="marketing-button marketing-button-quiet" href="#features">Explore features <span>↓</span></a></div><div className="marketing-hero-points"><span><Check size={15} />Built for gym owners</span><span><Check size={15} />One connected workspace</span><span><Check size={15} />No card required to explore</span></div></div><DashboardPreview /></div><div className="marketing-container marketing-hero-bottom"><div><span className="marketing-scroll-line" />Designed around your daily operations</div><div>MEMBERS <span>·</span> ATTENDANCE <span>·</span> PAYMENTS <span>·</span> GROWTH</div></div></section>

    <section className="marketing-capability-strip"><div className="marketing-container"><p>EVERYTHING YOU NEED TO RUN A GYM</p><div><span><Users size={17} />Members</span><span><CalendarCheck2 size={17} />Memberships</span><span><Activity size={17} />Attendance</span><span><CreditCard size={17} />Payments</span><span><ChartNoAxesColumn size={17} />Reports</span></div></div></section>

    <section className="marketing-section marketing-features" id="features"><div className="marketing-container"><div className="marketing-section-heading marketing-reveal"><div><span className="marketing-section-kicker">ONE WORKSPACE. LESS BUSYWORK.</span><h2>Everything your gym needs.<br /><span>Nothing you don’t.</span></h2></div><p>Spend less time chasing spreadsheets and more time building a gym people want to come back to.</p></div><div className="marketing-feature-grid">{featureCards.map(({ icon: Icon, title, body, availability }, index) => <article className="marketing-feature-card marketing-reveal" key={title} style={{ "--reveal-order": index }}><span className="marketing-feature-icon"><Icon size={20} strokeWidth={1.8} /></span><h3>{title}</h3><p>{body}</p><span className="marketing-feature-plan">{availability}</span></article>)}</div></div></section>

    <section className="marketing-showcase" id="product"><div className="marketing-container"><div className="marketing-section-heading marketing-section-heading-light marketing-reveal"><div><span className="marketing-section-kicker">MADE FOR THE REAL WORK</span><h2>Know what’s happening.<br /><span>Know what to do next.</span></h2></div><p>Purpose-built views keep day-to-day work simple and give you the detail to make better decisions.</p></div><div className="marketing-showcase-list">{showcaseItems.map((item) => <article className={"marketing-showcase-row marketing-reveal showcase-" + item.variant} key={item.number}><div className="marketing-showcase-copy"><span className="marketing-showcase-number">{item.number}</span><div><span className="marketing-section-kicker">{item.eyebrow}</span><h3>{item.title}</h3><p>{item.body}</p><a href="#features">Explore Fitivo <ArrowRight size={15} /></a></div></div><ProductMockup variant={item.variant} /></article>)}</div></div></section>

    <section className="marketing-section marketing-how" id="how-it-works"><div className="marketing-container"><div className="marketing-section-heading marketing-reveal"><div><span className="marketing-section-kicker">A BETTER ROUTINE STARTS HERE</span><h2>From first check-in<br /><span>to long-term growth.</span></h2></div><p>Set up the essentials once. Then keep your team and your members moving forward.</p></div><div className="marketing-steps"><article className="marketing-step marketing-reveal"><span className="marketing-step-number">01</span><div className="marketing-step-icon"><Dumbbell size={22} /></div><h3>Register your gym</h3><p>Create an owner workspace and start an eligible seven-day trial when public registration is open.</p></article><article className="marketing-step marketing-reveal"><span className="marketing-step-number">02</span><div className="marketing-step-icon"><Users size={22} /></div><h3>Set up members & staff</h3><p>Add member records, configure membership plans, and invite your team with role-based access.</p></article><article className="marketing-step marketing-reveal"><span className="marketing-step-number">03</span><div className="marketing-step-icon"><ChartNoAxesColumn size={22} /></div><h3>Manage & grow</h3><p>Follow attendance, renewals, payments, and reports as your gym gets stronger.</p></article></div></div></section>

    <section className="marketing-pricing" id="pricing"><div className="marketing-container"><div className="marketing-pricing-heading marketing-reveal"><span className="marketing-section-kicker">CLEAR PLANS. ROOM TO GROW.</span><h2>Choose your next level.</h2><p>Plan names, prices, billing cycles, and included features come from Fitivo’s active subscription catalog.</p></div>{!pricingAvailable ? <div className="marketing-pricing-state" role="status"><ShieldCheck size={22} /><div><b>Pricing is temporarily unavailable.</b><p>Please sign in or try again in a little while.</p></div><Link href="/login">Log in <ArrowRight size={15} /></Link></div> : !plans.length ? <div className="marketing-pricing-state" role="status"><ShieldCheck size={22} /><div><b>No paid plans are currently available.</b><p>Fitivo’s subscription catalog is being updated.</p></div><Link href="/login">Log in <ArrowRight size={15} /></Link></div> : <div className="marketing-plan-grid">{plans.map((plan) => {
      const included = Object.entries(plan.features || {}).filter(([, enabled]) => enabled).map(([key]) => FEATURE_LABELS[key]).filter(Boolean);
      const limits = [limitLabel(plan.limits?.members, "members"), limitLabel(plan.limits?.staff, "staff"), (plan.limits?.branches ?? 1) + " " + (plan.limits?.branches === 1 ? "branch" : "branches")];
      const recommended = plan.key === "pro";
      return <article className={"marketing-plan-card marketing-reveal" + (recommended ? " is-recommended" : "")} key={plan.id}><div className="marketing-plan-top"><div><span className="marketing-plan-label">{plan.name}</span><p>{recommended ? "The balanced choice for growing gyms." : plan.key === "professional" ? "For ambitious, multi-location teams." : "The essentials to get your gym organized."}</p></div>{recommended && <span className="marketing-recommended">MOST POPULAR</span>}</div><div className="marketing-price">{formatPrice(plan.price)}<small>/{intervalLabel(plan.interval)}</small></div><p className="marketing-plan-note">Billed {plan.interval === "yearly" ? "yearly" : "monthly"} · PKR</p><div className="marketing-plan-limits">{limits.map((item) => <span key={item}><Check size={14} />{item}</span>)}</div><div className="marketing-plan-rule" /><ul>{included.slice(0, 7).map((item) => <li key={item}><Check size={15} />{item}</li>)}</ul>{included.length > 7 && <p className="marketing-plan-more">Plus {included.length - 7} more included capabilities</p>}<Link className={"marketing-plan-cta" + (recommended ? " is-primary" : "")} href={trialAvailable ? "/register" : "#trial"}>{trialAvailable ? "Start a 7-day trial" : "View trial details"}<ArrowRight size={16} /></Link></article>;
    })}</div>}<p className="marketing-pricing-footnote">Plan limits and feature availability are based on your selected plan. Paid plans activate only after payment is independently verified and reconciled by Fitivo.</p></div></section>

    <section className="marketing-trial" id="trial"><div className="marketing-container marketing-trial-inner"><div className="marketing-trial-copy marketing-reveal"><span className="marketing-section-kicker">YOUR FIRST WEEK, ON US</span><h2>Seven days to find<br />your <span>better rhythm.</span></h2><p>Set up a real gym workspace, invite your team, and explore Fitivo’s features during your eligible trial.</p><ul><li><Check size={17} />One seven-day trial per eligible gym identity</li><li><Check size={17} />Trial features follow the configured trial plan{trialPlanName ? " · " + trialPlanName : ""}</li><li><Check size={17} />After expiry, paid access requires verified payment</li></ul>{trialAvailable ? <Link className="marketing-button marketing-button-primary" href="/register">Start your 7-day free trial <ArrowRight size={17} /></Link> : <div className="marketing-trial-paused" role="status"><ShieldCheck size={18} /><span>Public trial registration is currently unavailable. Fitivo has not enabled or bypassed registration.</span></div>}<p className="marketing-trial-login">Already have a Fitivo account? <Link href="/login">Log in <ArrowUpRight size={14} /></Link></p></div><div className="marketing-trial-visual marketing-reveal"><div className="trial-orbit orbit-one" /><div className="trial-orbit orbit-two" /><div className="trial-center-mark"><Dumbbell size={34} /></div><div className="trial-floating-card trial-card-one"><span><Check size={15} /></span><div><b>Your gym. Your team.</b><small>One shared workspace</small></div></div><div className="trial-floating-card trial-card-two"><span><CalendarCheck2 size={15} /></span><div><b>7 days to explore</b><small>No automatic renewal</small></div></div><div className="trial-floating-card trial-card-three"><span><ShieldCheck size={15} /></span><div><b>Verified by Fitivo</b><small>Paid access stays protected</small></div></div></div></div></section>

    <section className="marketing-section marketing-faq" id="faq"><div className="marketing-container marketing-faq-layout"><div className="marketing-faq-intro marketing-reveal"><span className="marketing-section-kicker">GOOD QUESTIONS</span><h2>Before you<br /><span>get started.</span></h2><p>Clear answers about plans, trials, and the way Fitivo handles gym access.</p><a href="#contact">Still need help? Find contact information <ArrowRight size={15} /></a></div><div className="marketing-faq-list">{faqItems.map((item, index) => <details className="marketing-faq-item marketing-reveal" key={item.q} open={index === 0}><summary>{item.q}<span><i /><i /></span></summary><p>{item.a}</p></details>)}</div></div></section>

    <section className="marketing-final-cta"><div className="marketing-container marketing-final-inner"><div><span className="marketing-section-kicker">MAKE MORE ROOM FOR GROWTH</span><h2>Ready to transform<br />your gym management?</h2><p>Bring your daily operations into one purposeful workspace.</p></div><div className="marketing-final-actions"><Link className="marketing-button marketing-button-light" href={trialHref}>{trialAvailable ? "Start your free trial" : "Explore trial details"}<ArrowRight size={17} /></Link><Link className="marketing-final-login" href="/login">Log in to Fitivo <ArrowUpRight size={15} /></Link></div><div className="marketing-final-decoration" aria-hidden="true"><span /><span /><span /></div></div></section>

    <footer className="marketing-footer"><div className="marketing-container"><div className="marketing-footer-main"><div className="marketing-footer-brand"><Brand footer /><p>Gym management that keeps your business moving.</p><span>BUILT FOR THE PEOPLE BEHIND THE GYM.</span></div><div className="marketing-footer-column"><b>Explore</b><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#pricing">Pricing</a><a href="#faq">FAQs</a></div><div className="marketing-footer-column"><b>Your account</b><Link href={trialHref}>{trialAvailable ? "Start free trial" : "Trial availability"}</Link><Link href="/login">Log in</Link></div><div className="marketing-footer-column" id="contact"><b>Contact</b><p>For support, use the channel provided to your gym. Fitivo does not publish a public contact address here.</p></div></div><div className="marketing-footer-bottom"><span>© {new Date().getFullYear()} Fitivo. All rights reserved.</span><div><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Service</Link></div><a className="marketing-back-top" href="#home">Back to top ↑</a></div></div></footer>
  </main>;
}
