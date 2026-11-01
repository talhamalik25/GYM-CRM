import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MARKETING_SUPPORT_CHANNEL } from "../../lib/marketingConfig.js";
import FitivoLogo from "../brand/fitivo-logo.js";


export function MarketingButton({ href, variant = "primary", className = "", children, ...props }) {
  const classes = `${"m-marketing-button exact:inline-flex exact:justify-center exact:items-center exact:[gap:10px] exact:[min-height:49px] exact:[padding:12px_21px] exact:[border:1px_solid_transparent] exact:[border-radius:11px] exact:[font-size:13px] exact:[font-weight:600] exact:[line-height:1.4] exact:text-center exact:[transition:background_180ms,_box-shadow_180ms,_transform_180ms,_border-color_180ms] exact:[&_svg]:[flex-shrink:0] exact:[&_svg]:[transition:transform_180ms] exact:[&:hover_svg]:[transform:translateX(2px)] exact:[&:active]:[transform:translateY(1px)] exact:[&.m-marketing-primary]:[color:white] exact:[&.m-marketing-primary]:[background:var(--brand)] exact:[&.m-marketing-primary]:[box-shadow:0_3px_6px_#4f46e51c,_inset_0_1px_0_#ffffff25] exact:[&.m-marketing-primary:hover]:[background:var(--brand-hover)] exact:[&.m-marketing-primary:hover]:[box-shadow:0_6px_18px_#4f46e52b] exact:[&.m-marketing-outline]:[color:var(--m-ink,_#161b2e)] exact:[&.m-marketing-outline]:[border-color:var(--m-line,_#e7e8ef)] exact:[&.m-marketing-outline]:[background:white] exact:[&.m-marketing-outline]:[box-shadow:0_2px_2px_#161b2e04] exact:[&.m-marketing-outline:hover]:[border-color:#c5c3ed] exact:[&.m-marketing-outline:hover]:[background:#f9f9ff] exact:[&.m-marketing-inverse]:[color:white] exact:[&.m-marketing-inverse]:[background:transparent] exact:[&.m-marketing-inverse]:[border-color:#ffffff30] exact:[&.m-marketing-inverse:hover]:[background:#ffffff10] exact:[&.m-marketing-quiet]:[color:var(--brand)] exact:[&.m-marketing-quiet]:[background:transparent]"} ${({"primary":"m-marketing-primary","outline":"m-marketing-outline","inverse":"m-marketing-inverse","quiet":"m-marketing-quiet"})[variant] || "m-marketing-primary"} ${className}`;
  if (href) return <Link href={href} className={classes} {...props}>{children}</Link>;
  return <button type="button" className={classes} {...props}>{children}</button>;
}

export function MarketingPrimaryAction({ trialAvailable, className = "", children, ...props }) {
  if (trialAvailable) return <MarketingButton href="/register" className={className} {...props}>{children || "Start 7-day free trial"}<ArrowRight size={16} aria-hidden="true" /></MarketingButton>;
  if (!MARKETING_SUPPORT_CHANNEL) return <MarketingButton href="/login" className={className} {...props}>{children || "Log in to Fitivo"}<ArrowRight size={16} aria-hidden="true" /></MarketingButton>;
  const external = MARKETING_SUPPORT_CHANNEL.href.startsWith("https:");
  return <a href={MARKETING_SUPPORT_CHANNEL.href} target={external ? "_blank" : undefined} rel={external ? "noreferrer noopener" : undefined} className={`${"m-marketing-button exact:inline-flex exact:justify-center exact:items-center exact:[gap:10px] exact:[min-height:49px] exact:[padding:12px_21px] exact:[border:1px_solid_transparent] exact:[border-radius:11px] exact:[font-size:13px] exact:[font-weight:600] exact:[line-height:1.4] exact:text-center exact:[transition:background_180ms,_box-shadow_180ms,_transform_180ms,_border-color_180ms] exact:[&_svg]:[flex-shrink:0] exact:[&_svg]:[transition:transform_180ms] exact:[&:hover_svg]:[transform:translateX(2px)] exact:[&:active]:[transform:translateY(1px)] exact:[&.m-marketing-primary]:[color:white] exact:[&.m-marketing-primary]:[background:var(--brand)] exact:[&.m-marketing-primary]:[box-shadow:0_3px_6px_#4f46e51c,_inset_0_1px_0_#ffffff25] exact:[&.m-marketing-primary:hover]:[background:var(--brand-hover)] exact:[&.m-marketing-primary:hover]:[box-shadow:0_6px_18px_#4f46e52b] exact:[&.m-marketing-outline]:[color:var(--m-ink,_#161b2e)] exact:[&.m-marketing-outline]:[border-color:var(--m-line,_#e7e8ef)] exact:[&.m-marketing-outline]:[background:white] exact:[&.m-marketing-outline]:[box-shadow:0_2px_2px_#161b2e04] exact:[&.m-marketing-outline:hover]:[border-color:#c5c3ed] exact:[&.m-marketing-outline:hover]:[background:#f9f9ff] exact:[&.m-marketing-inverse]:[color:white] exact:[&.m-marketing-inverse]:[background:transparent] exact:[&.m-marketing-inverse]:[border-color:#ffffff30] exact:[&.m-marketing-inverse:hover]:[background:#ffffff10] exact:[&.m-marketing-quiet]:[color:var(--brand)] exact:[&.m-marketing-quiet]:[background:transparent]"} ${"m-marketing-primary"} ${className}`} {...props}>{children || "Request access"}<ArrowRight size={16} aria-hidden="true" /></a>;
}

export function MarketingPill({ children, className = "" }) {
  return <span className={`${"m-marketing-pill exact:inline-flex exact:items-center exact:[gap:9px] exact:[border:1px_solid_#e1dff8] exact:[border-radius:99px] exact:[padding:7px_12px] exact:[background:#f6f5ff] exact:[color:#5950b6] exact:[font-size:10px] exact:[font-weight:600] exact:[letter-spacing:.055em] exact:[line-height:1.5]"} ${className}`}>{children}</span>;
}

export function MarketingBrand({ inverse = false, className = "" }) {
  return <Link href="/" aria-label="Fitivo home" className={`m-marketing-brand inline-flex shrink-0 items-center ${className}`}>
    <FitivoLogo width={126} height={42} inverse={inverse} />
  </Link>;
}

export function MarketingSection({ as: Element = "section", id, className = "", containerClassName = "", spacing = true, children, ...props }) {
  return <Element id={id} className={`${spacing ? "m-marketing-section exact:[padding-block:var(--m-section,_96px)]" : ""} ${className}`} {...props}><div className={`${"m-marketing-container exact:[width:min(1184px,_calc(100%_-_64px))] exact:[margin-inline:auto] exact:at-most-639:[width:calc(100%_-_40px)] exact:at-most-359:[width:calc(100%_-_32px)]"} ${containerClassName}`}>{children}</div></Element>;
}

export function MarketingHeading({ eyebrow, title, children, centered = false }) {
  return <div className={`${"m-marketing-sectionHeading exact:[max-width:620px] exact:[&_h2]:[margin:0] exact:[&_h2]:[font-size:clamp(30px,_3.6vw,_44px)] exact:[&_h2]:[line-height:1.18] exact:[&_h2]:[font-weight:600] exact:[&_h2]:[letter-spacing:-.045em] exact:[&_h2]:[text-wrap:balance] exact:at-most-639:[&_h2]:[font-size:32px]"} ${centered ? "m-marketing-centered exact:[margin:0_auto_44px] exact:text-center exact:at-most-639:[margin-bottom:30px]" : ""}`}><p className={"m-marketing-eyebrow exact:[margin:0_0_18px] exact:[color:var(--brand)] exact:[font-size:10px] exact:[line-height:1.5] exact:[font-weight:700] exact:[letter-spacing:.16em]"}>{eyebrow}</p><h2>{title}</h2>{children && <p className={"m-marketing-description exact:[margin-top:19px] exact:[color:var(--m-muted)] exact:[font-size:15px] exact:[line-height:1.8] exact:at-most-639:[font-size:14px]"}>{children}</p>}</div>;
}
