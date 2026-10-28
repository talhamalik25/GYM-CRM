import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SITE, MARKETING_PAGES } from "../../../lib/marketing/site.js";
import { PageHero, PageSection, PageActions, NumberedSteps, PageClosing } from "../../../components/marketing/marketing-page-sections.js";
import styles from "../../../components/marketing/marketing-pages.module.css";
import { GUIDE_ROLES } from "../../../lib/marketing/pages.js";
export const metadata = { title: "Portal guide & setup | Fitivo", description: MARKETING_PAGES["guide"].description, alternates: { canonical: SITE.url + "/guide" } };

export default function Page() {
  return <div className={styles.pages}><PageHero eyebrow="Fitivo / The portal handbook" title="Find your role." accent="Build your routine." description="A practical starting point for gym owners, administrators and trainers, with guidance for supporting members. Setup help is included with every plan."><PageActions primary="/contact" primaryLabel="Ask for a walkthrough" secondary="#owner" secondaryLabel="Start with gym setup" /></PageHero>
    <PageSection eyebrow="A confident start" title="Use the guide for your responsibilities." description="Your account and subscription determine which tools appear. This guide explains the workflow; it does not grant access or activate a subscription.">
      <div className={styles.guideLayout}><nav className={styles.guideNav} aria-label="Guide roles"><span>In this handbook</span>{GUIDE_ROLES.map((role, i) => <a href={"#" + role.id} key={role.id}><b>0{i + 1}</b>{role.title}</a>)}<Link href="/pricing">Compare plan outlines <ArrowUpRight size={14} aria-hidden="true" /></Link></nav>
      <div>{GUIDE_ROLES.map((role, i) => <section id={role.id} className={styles.guideChapter} key={role.id} tabIndex={-1}><p className={styles.eyebrow}>0{i + 1} / {role.title}</p><h2>{role.summary}</h2><ol>{role.steps.map(step => <li key={step}>{step}</li>)}</ol></section>)}</div></div>
    </PageSection>
    <PageSection eyebrow="Your first gym setup" title="A clear order. A smoother start." tinted><NumberedSteps /><div className={styles.callout}><h3>Two different kinds of payments.</h3><p>Member fees belong to your gym’s operations. Your Fitivo subscription is managed separately by the gym owner in Plan & billing. Confirm the correct amount and recipient before transferring funds.</p><Link className={styles.textLink} href="/pricing#payment-process">Understand subscription activation <ArrowRight size={16} aria-hidden="true" /></Link></div></PageSection>
    <PageClosing /></div>;
}
