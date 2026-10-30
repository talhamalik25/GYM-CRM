import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SITE, MARKETING_PAGES, trialRequestHref } from "../../lib/marketing/site.js";
import MarketingShellAction from "./marketing-shell-action.js";


// Route foundations for step 2. Detailed page sections follow in step 4.
export default function MarketingPageIntro({ page }) {
  const content = MARKETING_PAGES[page];
  const trial = page === "free-trial";
  return <section className={`${"m-marketing-shell-container exact:[width:min(1184px,_calc(100%_-_64px))] exact:[margin-inline:auto] exact:at-most-639:[width:calc(100%_-_40px)]"} ${"m-marketing-shell-pageIntro exact:[padding-block:clamp(64px,_8vw,_112px)] exact:[min-height:60vh] exact:[&_h1]:[max-width:800px] exact:[&_h1]:[margin:24px_0] exact:[&_h1]:[font-size:clamp(36px,_5vw,_64px)] exact:[&_h1]:[line-height:1.1] exact:[&_h1]:[letter-spacing:-.045em] exact:[&_h1]:[font-weight:600] exact:[&_h1]:[text-wrap:balance]"}`}>
    <p className={"m-marketing-shell-eyebrow exact:[color:var(--shell-brand)] exact:[font-size:11px] exact:[letter-spacing:.12em] exact:[text-transform:uppercase] exact:[font-weight:600]"}>{content.eyebrow}</p>
    <h1>{content.title}</h1>
    <p className={"m-marketing-shell-pageDescription exact:[max-width:650px] exact:[font-size:17px] exact:[line-height:1.85] exact:[color:var(--shell-muted)] exact:at-most-639:[font-size:15px]"}>{content.description}</p>
    <div className={"m-marketing-shell-pageActions exact:flex exact:flex-wrap exact:[gap:12px] exact:[margin-top:28px]"}>
      <a className={"m-marketing-shell-primary exact:[border-radius:9px] exact:inline-flex exact:items-center exact:justify-center exact:[gap:10px] exact:[min-height:44px] exact:[padding:11px_16px] exact:[font-size:12px] exact:[line-height:1.5] exact:[font-weight:600] exact:[transition:background_180ms,_box-shadow_180ms] exact:[background:var(--shell-brand)] exact:[color:white] exact:[border:1px_solid_var(--shell-brand)] exact:[box-shadow:0_3px_8px_#4f46e518] exact:[&:hover]:[background:#4338ca]"} href={trial ? trialRequestHref() : `mailto:${SITE.email}`}>{trial ? "Email a trial request" : "Email AKTech"}<ArrowRight size={16} aria-hidden="true" /></a>
      {content.link && <MarketingShellAction variant="secondary" className={""} href={content.link.href}>{content.link.label}<ArrowRight size={16} aria-hidden="true" /></MarketingShellAction>}
    </div>
    {trial && <p className={"m-marketing-shell-pageNote exact:[max-width:580px] exact:[margin-top:18px] exact:[font-size:13px] exact:[line-height:1.8] exact:[color:var(--shell-muted)]"}>This opens your email app. Sending an email requests a review; it does not create an account or activate access.</p>}
    {(page === "contact" || trial) && <address className={"m-marketing-shell-pageContact exact:flex exact:flex-wrap exact:[gap:12px_24px] exact:[margin-top:32px] exact:[font-size:14px] exact:[font-style:normal] exact:[color:var(--shell-muted)] exact:[&_a]:[text-decoration:underline] exact:[&_a]:[text-underline-offset:4px] exact:at-most-639:flex-col"}><a href={`mailto:${SITE.email}`}>{SITE.email}</a><a href={SITE.phoneHref}>{SITE.phone}</a><span>{SITE.location}</span></address>}
  </section>;
}
