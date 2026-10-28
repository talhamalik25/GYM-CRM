import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SITE, MARKETING_PAGES } from "../../../lib/marketing/site.js";
import { PageHero, PageSection, PageClosing } from "../../../components/marketing/marketing-page-sections.js";
import styles from "../../../components/marketing/marketing-pages.module.css";
import MarketingInquiryForm from "../../../components/marketing/marketing-inquiry-form.js";
export const metadata = { title: "Contact AKTech | Fitivo", description: MARKETING_PAGES["contact"].description, alternates: { canonical: SITE.url + "/contact" } };

export default function Page() {
  return <div className={styles.pages}><PageHero eyebrow="Contact / AKTech Digital Solutions" title="Let’s talk" accent="about your gym." description={MARKETING_PAGES.contact.description} />
    <PageSection><div className={styles.contactLayout}><div><p className={styles.eyebrow}>A direct conversation</p><h2 className={styles.spotTitle}>Reach the people<br />behind Fitivo.</h2><dl className={styles.contactDetails}><div><dt>Email us</dt><dd><a href={"mailto:" + SITE.email}>{SITE.email}</a></dd></div><div><dt>Call us</dt><dd><a href={SITE.phoneHref}>{SITE.phone}</a></dd></div><div><dt>Location</dt><dd>{SITE.location}</dd></div><div><dt>{SITE.company}</dt><dd><a href={SITE.companyUrl} target="_blank" rel="noopener noreferrer">Visit AKTech <ArrowUpRight size={14} aria-hidden="true" /><span className={styles.srOnly}> (opens in a new tab)</span></a></dd></div></dl><div className={styles.smallCallout}><h3>New to Fitivo?</h3><p>Start with a trial request or ask for a walkthrough based on your gym’s setup.</p><Link className={styles.textLink} href="/free-trial">Request a trial <ArrowRight size={16} aria-hidden="true" /></Link></div></div><MarketingInquiryForm /></div></PageSection>
    <PageClosing /></div>;
}
