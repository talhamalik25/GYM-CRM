import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SITE } from "../../lib/marketing/site.js";
import styles from "./marketing-shell.module.css";

export default function MarketingAnnouncement() {
  return <aside className={styles.announcement} aria-label="Trial and onboarding">
    <div className={styles.container}>
      <p>{SITE.announcement}</p>
      <div><Link href="/free-trial">Try Free Now <ArrowUpRight size={14} aria-hidden="true" /></Link><span>{SITE.trial.note}</span></div>
    </div>
  </aside>;
}
