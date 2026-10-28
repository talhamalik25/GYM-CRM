import Link from "next/link";
import { Activity, ArrowUpRight, BellRing, CalendarDays, ChartNoAxesCombined, CreditCard, Dumbbell, Layers3, Users } from "lucide-react";
import { FEATURES } from "../../lib/marketing/home.js";
import styles from "./marketing-home.module.css";

const icons = { members: Users, attendance: Activity, plans: Layers3, trainers: Dumbbell, schedule: CalendarDays, fees: CreditCard, renewals: BellRing, reports: ChartNoAxesCombined };

export default function MarketingFeatureGrid({ details = false }) {
  return <div className={styles.featureGrid}>{FEATURES.map(feature => {
    const Icon = icons[feature.icon];
    return <article key={feature.id} id={details ? feature.id : undefined} className={styles.featureCard} tabIndex={details ? -1 : undefined}>
      <div className={styles.featureTop}><Icon size={22} strokeWidth={1.6} aria-hidden="true" />{feature.status && <span>{feature.status}</span>}</div>
      <h3>{details ? feature.title : <Link href={`/features#${feature.id}`}>{feature.title}<ArrowUpRight size={15} aria-hidden="true" /></Link>}</h3>
      <p>{feature.description}</p>
    </article>;
  })}</div>;
}
