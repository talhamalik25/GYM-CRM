import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, ClipboardList, Dumbbell, FileText, MessageCircle, Plus, Users } from "lucide-react";
import { SITE } from "../../lib/marketing/site.js";
import { FAQS, GUIDANCE, ONBOARDING, ROLES } from "../../lib/marketing/home.js";
import { MarketingButton, MarketingSection } from "./marketing-primitives.js";
import MarketingProductShowcase from "./marketing-product-showcase.js";
import MarketingPreviewPlaceholder from "./marketing-preview-placeholder.js";
import MarketingFeatureGrid from "./marketing-feature-grid.js";
import MarketingPricing from "./marketing-pricing.js";
import styles from "./marketing-home.module.css";

function Heading({ eyebrow, children, description, centered = false }) {
  return <div className={`${styles.heading} ${centered ? styles.centered : ""}`}><p className={styles.eyebrow}>{eyebrow}</p><h2>{children}</h2>{description && <p className={styles.description}>{description}</p>}</div>;
}

export default function MarketingHome() {
  return <div className={styles.home}>
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.container}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span className={styles.dot} /> Built around your gym day</p>
          <h1 id="hero-title">Your whole gym.<br /><em>Working as one.</em></h1>
          <p className={styles.heroDescription}>From the first check-in to the next renewal, keep your members, team and daily operations connected with Fitivo.</p>
          <div className={styles.actions}><MarketingButton href="/free-trial">Start Free Trial <ArrowRight size={16} aria-hidden="true" /></MarketingButton><MarketingButton href="#features" variant="outline">Explore the Platform <ArrowUpRight size={16} aria-hidden="true" /></MarketingButton></div>
          <p className={styles.microcopy}><Check size={14} aria-hidden="true" />{SITE.trial.microcopy}</p>
        </div>
        <div id="product" className={styles.heroProduct} tabIndex={-1}><MarketingProductShowcase /></div>
      </div>
    </section>

    <div className={styles.roleStrip}><div className={styles.container}><p>Built around the people<br />who make your gym work.</p><ul>{ROLES.map(role => <li key={role.title}>{role.title}</li>)}</ul></div></div>

    <MarketingSection id="connected-day" className={styles.section}>
      <Heading eyebrow="A more connected day" description="A busy gym has enough moving parts. The records behind it should be easy to find, follow and trust.">Less chasing information.<br />More time on the gym floor.</Heading>
      <div className={styles.problemGrid}>
        <article className={styles.disconnected}><p className={styles.cardEyebrow}>The disconnected day</p><h3>The same questions.<br />In different places.</h3><ul>{[[ClipboardList, "Paper attendance registers"], [MessageCircle, "WhatsApp follow-ups"], [FileText, "Scattered fee notes"]].map(([Icon, label]) => <li key={label}><Icon size={19} aria-hidden="true" />{label}</li>)}</ul><p>Another register to check. Another payment to trace.</p></article>
        <article className={styles.connected}><p className={styles.cardEyebrow}>One gym workspace</p><h3>Start with a member.<br />Keep the rest connected.</h3><div className={styles.recordFlow}><span><Users size={21} aria-hidden="true" />Member record</span><div>{["Membership", "Attendance", "Fees & receipts"].map(item => <span key={item}>{item}</span>)}</div></div><Link href="/features" className={styles.textLink}>See how it fits together <ArrowRight size={16} aria-hidden="true" /></Link></article>
      </div>
    </MarketingSection>

    <MarketingSection id="features" className={styles.section}>
      <div className={styles.headingRow}><Heading eyebrow="The work, brought together">Good records.<br /><em>Better everyday decisions.</em></Heading><Link href="/features" className={styles.textLink}>Explore all features <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
      <MarketingFeatureGrid />
      <p className={styles.sectionNote}>Available features follow your plan and account permissions. Planned tools are labeled above.</p>
    </MarketingSection>

    <MarketingSection id="trainer-workspace" className={`${styles.section} ${styles.tinted}`}>
      <div className={styles.spotlight}>
        <div><Heading eyebrow="The trainer workspace" description="Give trainers a focused view of the members assigned to them, with the context to make the next conversation useful.">Know who’s training.<br /><em>Keep the details close.</em></Heading><ul className={styles.checklist}>{["Assigned member roster", "Membership status and expiry dates", "Recent attendance for assigned members"].map(item => <li key={item}><Check size={17} aria-hidden="true" />{item}</li>)}</ul><Link href="/features#trainers" className={styles.textLink}>Explore the trainer workspace <ArrowRight size={16} aria-hidden="true" /></Link></div>
        <MarketingPreviewPlaceholder compact title="Trainer workspace" description="A focused view of assigned members and their recent visits." areas={["Assigned members", "Recent attendance"]} />
      </div>
    </MarketingSection>

    <MarketingSection id="fees-finance" className={styles.section}>
      <div className={`${styles.spotlight} ${styles.financeSpotlight}`}>
        <MarketingPreviewPlaceholder compact title="Fees & finance" description="Follow the fee record, from the charge to the recorded payment." areas={["Member ledgers", "Payment records", "Receipts"]} />
        <div><Heading eyebrow="Clarity for the front desk" description="Keep the payment conversation grounded in your gym’s records. See what has been recorded and what still needs attention.">A clear fee record.<br /><em>A simpler follow-up.</em></Heading><ul className={styles.checklist}>{["Member fee ledgers", "Payment records & receipts", "Reports from recorded transactions"].map(item => <li key={item}><Check size={17} aria-hidden="true" />{item}</li>)}</ul><Link href="/features#fees" className={styles.textLink}>Inside fees & finance <ArrowRight size={16} aria-hidden="true" /></Link></div>
      </div>
    </MarketingSection>

    <MarketingSection id="roles" className={`${styles.section} ${styles.rolesSection}`}>
      <Heading eyebrow="One gym. Different responsibilities." centered description="Each person has a part in the day. Give your team the right access, with member records connecting their work.">The same gym.<br /><em>A purpose for every role.</em></Heading>
      <ol className={styles.roleCards}>{ROLES.map((role, index) => <li key={role.title}><span className={styles.number}>0{index + 1}</span><h3>{role.title}</h3><p>{role.description}</p><span className={styles.roleNote}>{role.note}</span></li>)}</ol>
      <p className={styles.sectionNote}>Members are supported through team-managed records; a separate member login portal is not currently available.</p>
    </MarketingSection>

    <MarketingSection id="how-it-works" className={styles.section}>
      <div className={styles.headingRow}><Heading eyebrow="A clear way in" description="Request your trial, wait for approval, then set up your gym with guidance from AKTech.">From a fresh start<br />to your everyday routine.</Heading><Link href="/guide" className={styles.textLink}>Open the portal guide <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
      <ol className={styles.steps}>{ONBOARDING.map((step, index) => <li key={step.title}><span className={styles.stepNumber}>0{index + 1}</span><h3>{step.title}</h3><p>{step.description}</p></li>)}</ol>
    </MarketingSection>

    <MarketingSection id="pricing" className={`${styles.section} ${styles.tinted}`}>
      <Heading eyebrow="Room for your next chapter" centered description="Choose the scope that fits your gym. PKR quotes, with portal guidance and onboarding help included in every plan.">A plan for today.<br /><em>Space for what’s next.</em></Heading>
      <MarketingPricing />
    </MarketingSection>

    <MarketingSection id="included" className={styles.section}>
      <div className={styles.headingRow}><Heading eyebrow="Included with every plan">A confident start.<br />For your whole team.</Heading><Link href="/guide" className={styles.textLink}>Read the portal guide <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
      <div className={styles.guidanceCards}>{GUIDANCE.map((item, index) => <article key={item.title}><span className={styles.number}>0{index + 1}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>
    </MarketingSection>

    <MarketingSection id="faq" className={`${styles.section} ${styles.faqSection}`}>
      <div className={styles.faqLayout}><div><Heading eyebrow="Before your first check-in">A few good<br /><em>questions.</em></Heading><p className={styles.description}>Want to discuss your gym’s setup?</p><Link href="/contact" className={styles.textLink}>Talk to AKTech <ArrowUpRight size={16} aria-hidden="true" /></Link></div><div className={styles.faqList}>{FAQS.map(item => <details key={item.question} name="fitivo-home-faq"><summary>{item.question}<Plus size={19} aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</div></div>
    </MarketingSection>

    <section className={styles.finalCta} aria-labelledby="final-cta-title"><div className={styles.container}><span className={styles.ctaIcon}><Dumbbell size={24} strokeWidth={1.6} aria-hidden="true" /></span><p className={styles.eyebrow}>Your next gym day</p><h2 id="final-cta-title">Bring your gym<br /><em>into the picture.</em></h2><p>Start with a 14-day trial request, with guidance for your team.<br />Gym access begins after approval.</p><div className={styles.actions}><MarketingButton href="/free-trial">Start Free Trial <ArrowRight size={16} aria-hidden="true" /></MarketingButton><MarketingButton href="/pricing" variant="outline">View plans <ArrowUpRight size={16} aria-hidden="true" /></MarketingButton></div><p className={styles.microcopy}>{SITE.trial.microcopy}</p></div></section>
  </div>;
}
