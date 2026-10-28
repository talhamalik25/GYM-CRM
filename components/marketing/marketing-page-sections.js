import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Plus } from "lucide-react";
import { SITE } from "../../lib/marketing/site.js";
import { GUIDANCE, ONBOARDING } from "../../lib/marketing/home.js";
import styles from "./marketing-pages.module.css";

export function PageHero({ eyebrow, title, accent, description, children, aside }) {
  return <section className={styles.hero}><div className={`${styles.container} ${aside ? styles.split : ""}`}><div><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}{accent && <><br /><em>{accent}</em></>}</h1><p className={styles.lead}>{description}</p>{children}</div>{aside}</div></section>;
}

export function PageSection({ id, eyebrow, title, description, children, tinted = false }) {
  return <section id={id} className={`${styles.section} ${tinted ? styles.tinted : ""}`}><div className={styles.container}>{(eyebrow || title) && <div className={styles.heading}>{eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}<h2>{title}</h2>{description && <p>{description}</p>}</div>}{children}</div></section>;
}

export function PageActions({ primary = "/free-trial", primaryLabel = "Start Free Trial", secondary, secondaryLabel }) {
  return <div className={styles.actions}><Link className={styles.primary} href={primary}>{primaryLabel}<ArrowRight size={16} aria-hidden="true" /></Link>{secondary && <Link className={styles.secondary} href={secondary}>{secondaryLabel}<ArrowUpRight size={16} aria-hidden="true" /></Link>}</div>;
}

export function BulletList({ items }) {
  return <ul className={styles.bullets}>{items.map(item => <li key={item}><Check size={16} aria-hidden="true" />{item}</li>)}</ul>;
}

export function NumberedSteps({ items = ONBOARDING }) {
  return <ol className={styles.steps}>{items.map((item, i) => <li key={item.title}><span className={styles.number}>0{i + 1}</span><h3>{item.title}</h3><p>{item.description}</p></li>)}</ol>;
}

export function IncludedGuidance() {
  return <PageSection eyebrow="Included with every plan" title="A confident start. For your whole team." description="Practical guidance for setting up Fitivo and using it in your gym’s daily routine." tinted><div className={styles.cards}>{GUIDANCE.map((item, i) => <article key={item.title}><span className={styles.number}>0{i + 1}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}</div><Link href="/guide" className={styles.textLink}>Read the portal guide <ArrowRight size={16} aria-hidden="true" /></Link></PageSection>;
}

export function PageFaq({ items, name }) {
  return <div className={styles.faq}>{items.map(item => <details key={item.question} name={name}><summary>{item.question}<Plus size={18} aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</div>;
}

export function PageClosing() {
  return <section className={styles.closing}><div className={styles.container}><p className={styles.eyebrow}>Your next gym day</p><h2>Good routines start<br /><em>with a clear picture.</em></h2><p>Request a {SITE.trial.days}-day trial, with setup guidance for your team.<br />Access begins after approval.</p><PageActions secondary="/pricing" secondaryLabel="View plan outlines" /><p className={styles.note}>{SITE.trial.microcopy}</p></div></section>;
}
