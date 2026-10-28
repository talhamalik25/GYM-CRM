import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { SITE, MARKETING_PAGES } from "../../../lib/marketing/site.js";
import { PageHero, PageSection, IncludedGuidance } from "../../../components/marketing/marketing-page-sections.js";
import styles from "../../../components/marketing/marketing-pages.module.css";
import { TRIAL_STEPS } from "../../../lib/marketing/pages.js";
import MarketingInquiryForm from "../../../components/marketing/marketing-inquiry-form.js";
export const metadata = { title: "Request a 14-day trial | Fitivo", description: MARKETING_PAGES["free-trial"].description, alternates: { canonical: SITE.url + "/free-trial" } };

export default function Page() {
  return <div className={styles.pages}><PageHero eyebrow="Your gym / A connected start" title="A clearer gym day" accent="starts here." description={"Request a " + SITE.trial.days + "-day Fitivo trial. No credit card or upfront payment is needed. AKTech reviews your request before access is arranged."}><p className={styles.trialNote}><Check size={16} aria-hidden="true" />{SITE.trial.microcopy}</p></PageHero>
    <PageSection><div className={styles.contactLayout}><div><p className={styles.eyebrow}>What happens next</p><h2 className={styles.spotTitle}>A request first.<br />Access after approval.</h2><ol className={styles.verticalSteps}>{TRIAL_STEPS.map((item, i) => <li key={item.title}><span className={styles.number}>0{i + 1}</span><div><h3>{item.title}</h3><p>{item.description}</p></div></li>)}</ol><div className={styles.smallCallout}><h3>Already have an account?</h3><p>Use your existing gym account to sign in. Questions about access can go directly to AKTech.</p><Link className={styles.textLink} href="/login">Portal login <ArrowRight size={16} aria-hidden="true" /></Link></div><p className={styles.note}>You can also email <a href={"mailto:" + SITE.email}>{SITE.email}</a> directly.</p></div><MarketingInquiryForm trial /></div></PageSection>
    <IncludedGuidance /></div>;
}
