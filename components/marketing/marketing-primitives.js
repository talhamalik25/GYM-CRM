import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { MARKETING_SUPPORT_CHANNEL } from "../../lib/marketingConfig.js";
import styles from "./marketing.module.css";

export function MarketingButton({ href, variant = "primary", className = "", children, ...props }) {
  const classes = `${styles.button} ${styles[variant] || styles.primary} ${className}`;
  if (href) return <Link href={href} className={classes} {...props}>{children}</Link>;
  return <button type="button" className={classes} {...props}>{children}</button>;
}

export function MarketingPrimaryAction({ trialAvailable, className = "", children, ...props }) {
  if (trialAvailable) return <MarketingButton href="/register" className={className} {...props}>{children || "Start 7-day free trial"}<ArrowRight size={16} aria-hidden="true" /></MarketingButton>;
  if (!MARKETING_SUPPORT_CHANNEL) return <MarketingButton href="/login" className={className} {...props}>{children || "Log in to Fitivo"}<ArrowRight size={16} aria-hidden="true" /></MarketingButton>;
  const external = MARKETING_SUPPORT_CHANNEL.href.startsWith("https:");
  return <a href={MARKETING_SUPPORT_CHANNEL.href} target={external ? "_blank" : undefined} rel={external ? "noreferrer noopener" : undefined} className={`${styles.button} ${styles.primary} ${className}`} {...props}>{children || "Request access"}<ArrowRight size={16} aria-hidden="true" /></a>;
}

export function MarketingPill({ children, className = "" }) {
  return <span className={`${styles.pill} ${className}`}>{children}</span>;
}

export function MarketingBrand({ inverse = false, className = "" }) {
  return <Link href="/" aria-label="Fitivo home" className={`${styles.brand} ${inverse ? styles.brandInverse : ""} ${className}`}>
    <span className={styles.brandMark}><Zap size={21} strokeWidth={2.4} aria-hidden="true" /></span><span>Fitivo<span className={styles.brandDot}>.</span></span>
  </Link>;
}

export function MarketingSection({ as: Element = "section", id, className = "", containerClassName = "", spacing = true, children, ...props }) {
  return <Element id={id} className={`${spacing ? styles.section : ""} ${className}`} {...props}><div className={`${styles.container} ${containerClassName}`}>{children}</div></Element>;
}

export function MarketingHeading({ eyebrow, title, children, centered = false }) {
  return <div className={`${styles.sectionHeading} ${centered ? styles.centered : ""}`}><p className={styles.eyebrow}>{eyebrow}</p><h2>{title}</h2>{children && <p className={styles.description}>{children}</p>}</div>;
}

export function MarketingPreviewCard({ children, className = "", label = "Illustrative workspace · Sample data", title = "Fitivo workspace" }) {
  return <div className={`${styles.previewFrame} ${className}`}>
    <div className={styles.previewChrome}><div className={styles.windowDots} aria-hidden="true"><i /><i /><i /></div><span>{title}</span><span className={styles.sampleBadge}>DEMO</span></div>
    {children}<div className={styles.previewCaption}><span />{label}</div>
  </div>;
}
