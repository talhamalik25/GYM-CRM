import { Activity, ArrowRight, ArrowUpRight, Building2, CalendarCheck2, Check, ChartNoAxesCombined, CreditCard, Dumbbell, Layers3, LockKeyhole, Plus, ShieldCheck, UserPlus, Users } from "lucide-react";
import MarketingProductShowcase from "./marketing-product-showcase.js";
import MarketingProductPreview, { BranchPreview, MemberPreview } from "./marketing-product-preview.js";
import MarketingPricing from "./marketing-pricing.js";
import { MarketingButton, MarketingHeading, MarketingPill, MarketingPrimaryAction, MarketingSection } from "./marketing-primitives.js";
import styles from "./marketing.module.css";

const features = [
  { icon: CalendarCheck2, title: "Keep the next renewal in sight.", text: "Create membership plans, track upcoming expiries, and keep a clear renewal history.", label: "MEMBERSHIPS" },
  { icon: Activity, title: "Make every visit count.", text: "Record check-ins and understand the daily rhythm of your gym.", label: "ATTENDANCE" },
  { icon: CreditCard, title: "Know where your money stands.", text: "Keep payments, outstanding dues, and receipts together. Less chasing, more clarity.", label: "PAYMENTS" },
  { icon: Dumbbell, title: "Give your team a clear role.", text: "Organize trainers and staff with role-based access. Capabilities and limits depend on your plan.", label: "YOUR TEAM" },
];

export default function MarketingHome({ plans, pricingAvailable, trialAvailable, trialPlanName }) {
  const faqItems = [
    ["Can I try Fitivo before choosing a plan?", trialAvailable ? `Yes. Eligible new gyms can start a seven-day ${trialPlanName} trial. Registration creates your owner account, gym workspace, and main branch. One trial is available per eligible gym identity. You’ll need a verified payment to continue with a paid plan.` : "Public trial registration is currently closed. Existing users can log in to their workspace. When registration is enabled, eligible new gyms can start a seven-day trial."],
    ["How much does Fitivo cost?", "The current plan prices and resource limits are shown above in PKR. Monthly plans are billed monthly; any yearly plan is clearly labeled with its annual total. Your workspace’s Billing page shows the available plans and your current subscription."],
    ["How do subscription payments work?", "Follow the payment instructions in your Billing page and submit your payment reference. Fitivo verifies the payment before activating or renewing your subscription. Submitting a reference alone does not activate access, and subscriptions do not renew automatically."],
    ["Can I manage more than one branch?", "Multi-branch management is available on Professional when enabled in the plan. You can manage locations in one organization, with branch reports and consolidated analytics where included. The current branch limit, including your main branch, is shown in the plan comparison."],
    ["How is access to my gym’s data controlled?", "Fitivo scopes gym data to your workspace and uses role-based permissions for owners and staff. Team members can access the operations allowed by their assigned role. See the Privacy information page for the current publication status of Fitivo’s privacy policy."],
    ["What happens when my trial or subscription ends?", "Subscription-protected operations become unavailable, while your records remain saved. Gym owners can still access Billing to request a paid plan or renewal. Access resumes after payment is verified and the subscription is activated."],
    ["Can I upgrade as my gym grows?", "Yes. Request a plan change from Plan & billing. Your current access stays in place while the request is reviewed. The new paid plan starts after payment verification, with a full billing term and no automatic proration or credit."],
  ];

  return <>
      <section className={styles.hero}>
        <div className={`${styles.container} ${styles.heroContent}`}>
          <MarketingPill><span className={styles.statusDot} /> BUILT FOR THE BUSINESS OF FITNESS <ArrowUpRight size={13} aria-hidden="true" /></MarketingPill>
          <h1>Your gym.<br /><span>One powerful platform.</span></h1>
          <p className={styles.heroDescription}>Less time on admin. More time for your members.<br className="hidden sm:block" /> Manage memberships, attendance, payments, and your team with Fitivo.</p>
          <div className={styles.heroActions}><MarketingPrimaryAction trialAvailable={trialAvailable} /><MarketingButton href="#features" variant="outline">Explore features <ArrowRight size={16} aria-hidden="true" /></MarketingButton></div>
          <p className={styles.heroNote}><span><Check size={14} />{trialAvailable ? "7 days to explore" : "Built around your daily operations"}</span><span><Check size={14} />Role-based team access</span></p>
        </div>
        <div className={`${styles.container} ${styles.heroProduct}`}><div className={styles.productOverline}><span><LayoutIcon /> YOUR GYM, AT A GLANCE</span><span>A clearer picture. A better day.</span></div><MarketingProductPreview /></div>
      </section>
      <div className={styles.capabilityStrip}><div className={styles.container}><p>From your first member to your next location.</p><div>{[[Users, "Members"], [CalendarCheck2, "Memberships"], [Activity, "Attendance"], [CreditCard, "Payments"], [ChartNoAxesCombined, "Analytics"]].map(([Icon, label]) => <span key={label}><Icon size={18} aria-hidden="true" />{label}</span>)}</div></div></div>

      <MarketingSection id="features" tabIndex={-1}>
        <div className={styles.headingRow}><MarketingHeading eyebrow="LESS BUSYWORK. MORE MOMENTUM." title={<>Run your gym.<br />Not a dozen different tools.</>} /><p className={styles.description}>From the front desk to the big picture, keep the work that matters in one connected place.</p></div>
        <div className={styles.featureBento}>
          <article className={styles.memberFeature}><div><span className={styles.featureIcon}><Users size={23} /></span><p className={styles.eyebrow}>MEMBER MANAGEMENT</p><h3>A better experience starts<br className="hidden sm:block" /> with knowing your members.</h3><p>Profiles, membership status, and payment history. Everything your team needs to make each interaction feel personal.</p></div><MemberPreview /></article>
          <article className={styles.analyticsFeature}><div><span className={styles.featureIcon}><ChartNoAxesCombined size={23} /></span><p className={styles.eyebrow}>REPORTS & ANALYTICS</p><h3>See the progress<br />behind the effort.</h3><p>Understand collections, member activity, and attendance. Advanced reports on eligible plans.</p></div><div className={styles.analyticsVisual} role="img" aria-label="Illustrative monthly activity chart with sample data"><div><span>Monthly activity</span><span>Sample data</span></div><svg viewBox="0 0 360 110" fill="none" aria-hidden="true"><path d="M0 90H360M0 55H360M0 20H360" stroke="currentColor" opacity=".1" /><path d="M0 100L30 92L60 95L90 75L120 82L150 61L180 66L210 38L240 45L270 20L300 26L330 8L360 15V110H0Z" fill="currentColor" opacity=".08" /><path d="M0 100L30 92L60 95L90 75L120 82L150 61L180 66L210 38L240 45L270 20L300 26L330 8L360 15" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" /></svg><div><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span></div></div></article>
          {features.map(({ icon: Icon, title, text, label }) => <article key={label} className={styles.featureCard}><span className={styles.featureIcon}><Icon size={22} /></span><p className={styles.eyebrow}>{label}</p><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </MarketingSection>

      <MarketingSection id="product" className={styles.productSection} tabIndex={-1}>
        <MarketingHeading centered eyebrow="MEET YOUR NEW WORKSPACE" title={<>Everything connected.<br />Nothing lost in the shuffle.</>}>Take a closer look at the tools behind a smoother gym day.<br className="hidden sm:block" /> Product previews use sample data, never private gym records.</MarketingHeading>
        <MarketingProductShowcase />
      </MarketingSection>

      <MarketingSection className={styles.branchSection}>
        <div className={styles.branchLayout}><div><MarketingPill className={styles.darkPill}><Building2 size={14} /> PROFESSIONAL</MarketingPill><h2>More locations.<br /><span>One bigger picture.</span></h2><p>Your next branch shouldn’t mean starting over. Bring your locations into one organization, with the visibility to keep moving forward.</p><ul>{["Manage branches in one workspace", "Review branch performance", "See consolidated organization analytics"].map((text) => <li key={text}><Check size={17} />{text}</li>)}</ul><a className={styles.lightLink} href="#pricing">Explore Professional <ArrowRight size={16} /></a><small>Subject to the features and limits in your configured plan.</small></div><BranchPreview /></div>
      </MarketingSection>

      <MarketingSection id="how-it-works" tabIndex={-1}>
        <MarketingHeading centered eyebrow="A STRAIGHTFORWARD START" title="Your next chapter starts here.">A simple path from setting up your workspace to running your day.</MarketingHeading>
        <ol className={styles.steps}>{[[Building2, "Register your gym", trialAvailable ? "Create your owner account and gym workspace. Your main branch is set up with your eligible 7-day trial." : "Get your gym workspace set up when registration is available. Already have an account? Log in to continue."], [UserPlus, "Add members and staff", "Create a membership plan, add a trainer and your first member, then invite staff within your plan’s limits."], [ChartNoAxesCombined, "Manage and grow", "Track attendance, record payments, and review reports. Make room for your next stage with the right plan."]].map(([Icon, title, copy], index) => <li key={title}><div className={styles.stepTop}><span><Icon size={23} /></span><b>0{index + 1}</b></div><h3>{title}</h3><p>{copy}</p></li>)}</ol>
      </MarketingSection>

      <MarketingSection id="pricing" className={styles.pricingSection} tabIndex={-1}>
        <MarketingHeading centered eyebrow="A PLAN FOR YOUR AMBITION" title="Start strong. Grow on your terms.">From a focused single gym to a growing network of branches.<br className="hidden sm:block" /> Clear pricing in PKR, with room for what comes next.</MarketingHeading>
        <MarketingPricing plans={plans} pricingAvailable={pricingAvailable} trialAvailable={trialAvailable} trialPlanName={trialPlanName} />
      </MarketingSection>

      {trialAvailable && <MarketingSection id="trial" className={styles.trialSection}><div className={styles.trialLayout}><div className={styles.trialNumber}>7<span>DAYS TO FIND YOUR RHYTHM</span></div><div><p className={styles.eyebrow}>YOUR GYM. YOUR TRIAL.</p><h2>Put Fitivo to work for a week.</h2><p>Bring your real routine into a connected workspace with a seven-day {trialPlanName} trial. Available once per eligible gym identity. Paid access requires verified payment.</p><MarketingPrimaryAction trialAvailable /></div></div></MarketingSection>}

      <MarketingSection id="faq" tabIndex={-1}><div className={styles.faqLayout}><MarketingHeading eyebrow="A LITTLE MORE CLARITY" title={<>Good questions.<br />Straight answers.</>}>Everything you need to know before your next step.</MarketingHeading><div className={styles.faqList}>{faqItems.map(([question, answer]) => <details key={question} name="fitivo-faq"><summary>{question}<Plus size={18} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></div></MarketingSection>

      <section className={styles.finalSection}><div className={`${styles.container} ${styles.finalCta}`}><div className={styles.ctaMark} aria-hidden="true"><Layers3 size={28} /></div><p className={styles.eyebrow}>LESS ADMIN. MORE POSSIBILITY.</p><h2>Ready to run your<br />gym smarter?</h2><p>Bring your people, payments, and progress together.</p><div className={styles.heroActions}><MarketingPrimaryAction trialAvailable={trialAvailable} /><MarketingButton variant="outline" href="#product">Take a closer look <ArrowRight size={16} /></MarketingButton></div><span className={styles.ctaNote}><LockKeyhole size={13} /> One workspace. The right access for your team.</span></div></section>
  </>;
}

function LayoutIcon() { return <ShieldCheck size={14} aria-hidden="true" />; }
