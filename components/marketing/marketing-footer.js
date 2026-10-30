import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SITE } from "../../lib/marketing/site.js";
import { MarketingBrand } from "./marketing-primitives.js";


export default function MarketingFooter() {
  return <footer className={"m-marketing-shell-footer exact:[padding-top:72px] exact:[border-top:1px_solid_var(--shell-line)] exact:[background:#fafafd] exact:[&_h2]:[margin:0_0_20px] exact:[&_h2]:[font-size:13px] exact:[&_h2]:[font-weight:600] exact:[&_h2]:[color:var(--shell-ink)] exact:[&_a:hover]:[color:var(--shell-brand)] exact:at-most-639:[padding-top:48px]"}>
    <div className={`${"m-marketing-shell-container exact:[width:min(1184px,_calc(100%_-_64px))] exact:[margin-inline:auto] exact:at-most-639:[width:calc(100%_-_40px)]"} ${"m-marketing-shell-footerGrid exact:grid exact:[grid-template-columns:1.5fr_1fr_1fr] exact:[gap:70px] exact:[padding-bottom:64px] exact:[&_nav]:flex exact:[&_nav]:flex-col exact:[&_nav]:[align-items:flex-start] exact:[&_nav]:[gap:12px] exact:[&_h2]:[margin-bottom:7px] exact:[&_nav_a]:[font-size:13px] exact:[&_nav_a]:[color:var(--shell-muted)] exact:at-most-1099:[gap:32px] exact:at-most-639:[grid-template-columns:1fr] exact:at-most-639:[gap:36px] exact:at-most-639:[padding-bottom:40px]"}`}>
      <div className={"m-marketing-shell-footerIntro exact:[max-width:325px] exact:[&_p]:[font-size:14px] exact:[&_p]:[line-height:1.8] exact:[&_p]:[color:var(--shell-muted)] exact:[&_.m-marketing-shell-tagline]:[font-size:17px] exact:[&_.m-marketing-shell-tagline]:[font-weight:500] exact:[&_.m-marketing-shell-tagline]:[color:var(--shell-ink)] exact:[&_.m-marketing-shell-tagline]:[margin:24px_0_8px] exact:at-most-639:[max-width:350px]"}><MarketingBrand /><p className={"m-marketing-shell-tagline"}>{SITE.tagline}</p><p>{SITE.description}</p></div>
      <nav aria-label="Explore Fitivo"><h2>Explore Fitivo</h2>{SITE.explore.map(({ label, href }) => <Link href={href} key={href}>{label}</Link>)}</nav>
      <div className={"m-marketing-shell-contactColumn exact:flex exact:flex-col exact:[align-items:flex-start] exact:[gap:12px] exact:[&_address]:flex exact:[&_address]:flex-col exact:[&_address]:[align-items:flex-start] exact:[&_address]:[font-size:13px] exact:[&_address]:[color:var(--shell-muted)] exact:[&_address]:[gap:12px] exact:[&_address]:[font-style:normal] exact:[&_address]:[margin-top:6px] exact:[&>a]:[font-size:13px] exact:[&>a]:[color:var(--shell-muted)]"}><h2>Talk to AKTech</h2><Link href="/about">About the product</Link><Link href="/contact">Contact & support</Link><address><a href={`mailto:${SITE.email}`}>{SITE.email}</a><a href={SITE.phoneHref}>{SITE.phone}</a><span>{SITE.location}</span></address></div>
    </div>
    <div className={`${"m-marketing-shell-container exact:[width:min(1184px,_calc(100%_-_64px))] exact:[margin-inline:auto] exact:at-most-639:[width:calc(100%_-_40px)]"} ${"m-marketing-shell-footerBottom exact:flex exact:[justify-content:space-between] exact:items-center exact:flex-wrap exact:[gap:16px_24px] exact:[border-top:1px_solid_var(--shell-line)] exact:[padding-block:24px] exact:[color:var(--shell-muted)] exact:[font-size:11px] exact:[&_a]:inline-flex exact:[&_a]:items-center exact:[&_a]:[gap:4px] exact:[&_nav]:flex exact:[&_nav]:[gap:16px] exact:at-most-639:flex-col exact:at-most-639:[align-items:flex-start]"}`}>
      <span>© {new Date().getFullYear()} {SITE.name}</span>
      <a href={SITE.companyUrl} target="_blank" rel="noopener noreferrer">A product by {SITE.company} <ArrowUpRight size={14} aria-hidden="true" /><span className={"m-marketing-shell-srOnly exact:absolute exact:[width:1px] exact:[height:1px] exact:[padding:0] exact:[margin:-1px] exact:overflow-hidden exact:[clip-path:inset(50%)] exact:[white-space:nowrap] exact:[border:0]"}> (opens in a new tab)</span></a>
      <span>{SITE.location}</span>
      <nav aria-label="Legal information"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav>
    </div>
  </footer>;
}
