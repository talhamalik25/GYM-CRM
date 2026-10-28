import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SITE } from "../../lib/marketing/site.js";
import { MarketingBrand } from "./marketing-primitives.js";
import styles from "./marketing-shell.module.css";

export default function MarketingFooter() {
  return <footer className={styles.footer}>
    <div className={`${styles.container} ${styles.footerGrid}`}>
      <div className={styles.footerIntro}><MarketingBrand /><p className={styles.tagline}>{SITE.tagline}</p><p>{SITE.description}</p></div>
      <nav aria-label="Explore Fitivo"><h2>Explore Fitivo</h2>{SITE.explore.map(({ label, href }) => <Link href={href} key={href}>{label}</Link>)}</nav>
      <div className={styles.contactColumn}><h2>Talk to AKTech</h2><Link href="/about">About the product</Link><Link href="/contact">Contact & support</Link><address><a href={`mailto:${SITE.email}`}>{SITE.email}</a><a href={SITE.phoneHref}>{SITE.phone}</a><span>{SITE.location}</span></address></div>
    </div>
    <div className={`${styles.container} ${styles.footerBottom}`}>
      <span>© {new Date().getFullYear()} {SITE.name}</span>
      <a href={SITE.companyUrl} target="_blank" rel="noopener noreferrer">A product by {SITE.company} <ArrowUpRight size={14} aria-hidden="true" /><span className={styles.srOnly}> (opens in a new tab)</span></a>
      <span>{SITE.location}</span>
      <nav aria-label="Legal information"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav>
    </div>
  </footer>;
}
