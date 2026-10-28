import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SITE, MARKETING_PAGES, trialRequestHref } from "../../lib/marketing/site.js";
import styles from "./marketing-shell.module.css";

// Route foundations for step 2. Detailed page sections follow in step 4.
export default function MarketingPageIntro({ page }) {
  const content = MARKETING_PAGES[page];
  const trial = page === "free-trial";
  return <section className={`${styles.container} ${styles.pageIntro}`}>
    <p className={styles.eyebrow}>{content.eyebrow}</p>
    <h1>{content.title}</h1>
    <p className={styles.pageDescription}>{content.description}</p>
    <div className={styles.pageActions}>
      <a className={styles.primary} href={trial ? trialRequestHref() : `mailto:${SITE.email}`}>{trial ? "Email a trial request" : "Email AKTech"}<ArrowRight size={16} aria-hidden="true" /></a>
      {content.link && <Link className={styles.secondary} href={content.link.href}>{content.link.label}<ArrowRight size={16} aria-hidden="true" /></Link>}
    </div>
    {trial && <p className={styles.pageNote}>This opens your email app. Sending an email requests a review; it does not create an account or activate access.</p>}
    {(page === "contact" || trial) && <address className={styles.pageContact}><a href={`mailto:${SITE.email}`}>{SITE.email}</a><a href={SITE.phoneHref}>{SITE.phone}</a><span>{SITE.location}</span></address>}
  </section>;
}
