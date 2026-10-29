import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { SITE, MARKETING_PAGES } from "../../../lib/marketing/site.js";
import { PageHero, PageSection, NumberedSteps, IncludedGuidance, PageFaq, PageClosing } from "../../../components/marketing/marketing-page-sections.js";
import styles from "../../../components/marketing/marketing-pages.module.css";
import MarketingPricing from "../../../components/marketing/marketing-pricing.js";
import { PLANS } from "../../../lib/marketing/plans.js";
import { BANK } from "../../../lib/marketing/bank.js";
import { PLAN_COMPARISON, PRICING_FAQS, PAYMENT_STEPS } from "../../../lib/marketing/pages.js";
export const metadata = { title: "Plans & pricing | Fitivo", description: MARKETING_PAGES["pricing"].description, alternates: { canonical: SITE.url + "/pricing" } };

export default function Page() {
  return <div className={styles.pages}><PageHero eyebrow="Pricing / A plan for your gym" title="Start with what" accent="your gym needs." description="Compare the draft plan outlines, then ask AKTech for a confirmed PKR quote. Portal guidance and setup help are included with every plan."><div className={styles.inlineLinks}><a href="#plans">Plan outlines</a><a href="#comparison">Feature comparison</a><a href="#payment-process">Payment process</a></div></PageHero>
    <PageSection id="plans" eyebrow="Monthly or annual" title="Choose the scope that fits."><MarketingPricing showDetailsLink={false} /></PageSection>
    <PageSection id="comparison" eyebrow="A closer look" title="Compare the plan outlines." description="This is a draft comparison, not a subscription contract. Confirm final features, resource limits and commercial terms with AKTech." tinted>
      <div className={styles.tableScroll} role="region" aria-label="Scrollable plan comparison" tabIndex={0}><table className={styles.comparison}><caption>Provisional Fitivo plan inclusions</caption><thead><tr><th scope="col">Feature</th>{PLANS.map(plan => <th key={plan.id} scope="col">{plan.name}</th>)}</tr></thead>{PLAN_COMPARISON.map(group => <tbody key={group.group}><tr className={styles.tableGroup}><th scope="rowgroup" colSpan={4}>{group.group}</th></tr>{group.rows.map(row => <tr key={row.label}><th scope="row">{row.label}</th>{row.included.map((included, i) => <td key={PLANS[i].id}>{included ? <><Check size={17} aria-hidden="true" /><span className={styles.srOnly}>Included in draft outline</span></> : <><Minus size={17} aria-hidden="true" /><span className={styles.srOnly}>Not included in draft outline</span></>}</td>)}</tr>)}</tbody>)}</table></div>
      <p className={styles.note}>Class scheduling, a member login portal and automated reminder delivery are not currently available on any plan.</p>
    </PageSection>
    <PageSection eyebrow="Before you choose" title="Pricing & trial questions."><PageFaq items={PRICING_FAQS} name="fitivo-pricing-faq" /></PageSection>
    <PageSection id="payment-process" eyebrow="Payment in Pakistan" title="From a quote to verified access." description="Payments are handled manually. Confirm your amount and bank instructions before making a transfer." tinted><NumberedSteps items={PAYMENT_STEPS} /><div className={styles.callout}><h3>Verification comes before activation.</h3><p>Allow up to {BANK.reviewWindowHours} hours for review. {BANK.activationNote} Screenshot uploads are not available yet; existing owners can submit a payment reference through Billing.</p><Link href="/payment" className={styles.textLink}>View payment details <ArrowRight size={16} aria-hidden="true" /></Link></div></PageSection>
    <IncludedGuidance /><PageClosing /></div>;
}
