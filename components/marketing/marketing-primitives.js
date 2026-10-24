import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { MARKETING_SUPPORT_CHANNEL } from "../../lib/marketingConfig.js";

const buttonStyles = {
  primary: "bg-brand text-brand-contrast hover:bg-brand-hover shadow-xs",
  outline: "border border-line-control bg-surface text-ink-muted hover:border-brand hover:bg-brand-soft/50",
  quiet: "text-ink-muted hover:bg-surface-raised",
  inverse: "border border-white/25 bg-white/5 text-white hover:bg-white/10",
};

export function MarketingButton({ href, variant = "primary", className = "", children, ...props }) {
  const classes = `inline-flex min-h-11 items-center justify-center gap-2 rounded-input px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${buttonStyles[variant] || buttonStyles.primary} ${className}`.trim();
  if (href) return <Link href={href} className={classes} {...props}>{children}</Link>;
  return <button className={classes} {...props}>{children}</button>;
}

export function MarketingPrimaryAction({ trialAvailable, className = "", children }) {
  if (trialAvailable) return <MarketingButton href="/register" className={className}>{children || "Start free trial"}<ArrowRight size={15} aria-hidden="true" /></MarketingButton>;
  if (!MARKETING_SUPPORT_CHANNEL) return <MarketingButton href="/login" className={className}>{children || "Log in"}<ArrowRight size={15} aria-hidden="true" /></MarketingButton>;

  const external = MARKETING_SUPPORT_CHANNEL.href.startsWith("https:");
  return <a href={MARKETING_SUPPORT_CHANNEL.href} target={external ? "_blank" : undefined} rel={external ? "noreferrer noopener" : undefined} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-input bg-brand px-4 text-sm font-semibold text-brand-contrast shadow-xs transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${className}`.trim()}>
    {children || "Request access"}<ArrowRight size={15} aria-hidden="true" />
  </a>;
}

export function MarketingPill({ children, className = "" }) {
  return <span className={`inline-flex items-center gap-2 rounded-pill border border-brand-muted bg-brand-soft px-3 py-1.5 text-[11px] font-semibold text-brand-soft-text ${className}`.trim()}>{children}</span>;
}

export function MarketingBrand({ inverse = false, className = "" }) {
  return <Link href="/" aria-label="Fitivo home" className={`inline-flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight ${inverse ? "text-white" : "text-ink"} ${className}`.trim()}>
    <span className={`grid size-8 place-items-center rounded-[10px] ${inverse ? "bg-white text-brand" : "bg-brand text-brand-contrast"}`}><Zap size={18} strokeWidth={2.25} aria-hidden="true" /></span>
    <span>Fitivo</span>
  </Link>;
}

export function MarketingSection({ as: Element = "section", id, className = "", containerClassName = "", spacing = true, children, ...props }) {
  const spacingClasses = spacing ? "px-5 py-16 sm:py-20 lg:py-24" : "";
  return <Element id={id} className={`${spacingClasses} ${className}`.trim()} {...props}>
    <div className={`mx-auto w-full max-w-6xl ${containerClassName}`.trim()}>{children}</div>
  </Element>;
}

export function MarketingPreviewCard({ children, className = "", label = "Sample data", title = "Fitivo preview" }) {
  return <div className={`overflow-hidden rounded-card border border-line bg-surface shadow-sm ${className}`.trim()}>
    <div className="flex h-9 items-center gap-1.5 border-b border-line bg-surface-raised px-3" aria-label={title}>
      <span className="size-2 rounded-full bg-grey-300" aria-hidden="true" />
      <span className="size-2 rounded-full bg-grey-300" aria-hidden="true" />
      <span className="size-2 rounded-full bg-grey-300" aria-hidden="true" />
      <span className="ml-auto text-[9px] font-medium text-ink-muted">{title}</span>
    </div>
    {children}
    <div className="flex items-center gap-2 border-t border-line bg-surface px-3 py-2 text-[9px] text-ink-subtle">
      <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />{label}
    </div>
  </div>;
}
