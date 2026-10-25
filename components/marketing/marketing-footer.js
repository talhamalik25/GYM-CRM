import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { MARKETING_SUPPORT_CHANNEL } from "../../lib/marketingConfig.js";
import { MarketingBrand } from "./marketing-primitives.js";
import styles from "./marketing.module.css";

export default function MarketingFooter({ trialAvailable }) {
  return <footer className={styles.footer}>
    <div className={`${styles.container} ${styles.footerGrid}`}>
      <div><MarketingBrand /><p className={styles.footerDescription}>Less admin. More momentum.<br />A better way to run your gym.</p><span className={styles.footerTag}>BUILT FOR THE BUSINESS OF FITNESS</span></div>
      <nav aria-label="Explore Fitivo"><h3>Platform</h3><a href="#features">Features</a><a href="#product">Product tour</a><a href="#how-it-works">How it works</a><a href="#pricing">Pricing</a></nav>
      <nav aria-label="Account and information"><h3>Resources</h3><a href="#faq">FAQs</a><Link href="/login">Log in <ArrowUpRight size={13} aria-hidden="true" /></Link>{trialAvailable && <Link href="/register">Start free trial</Link>}<Link href="/privacy">Privacy information</Link><Link href="/terms">Terms information</Link></nav>
      <div><h3>Your next chapter</h3><p className={styles.footerDescription}>One connected workspace.<br />More time for your members.</p>{MARKETING_SUPPORT_CHANNEL && <a className={styles.textLink} href={MARKETING_SUPPORT_CHANNEL.href} rel={MARKETING_SUPPORT_CHANNEL.href.startsWith("https:") ? "noopener noreferrer" : undefined} target={MARKETING_SUPPORT_CHANNEL.href.startsWith("https:") ? "_blank" : undefined}>Contact Fitivo <ArrowUpRight size={15} aria-hidden="true" /></a>}</div>
    </div>
    <div className={`${styles.container} ${styles.footerBottom}`}><span>© {new Date().getFullYear()} Fitivo. All rights reserved.</span><a href="#home">Back to top ↑</a></div>
  </footer>;
}
