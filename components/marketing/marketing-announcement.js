import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SITE } from "../../config/site.js";


export default function MarketingAnnouncement() {
  return <aside className={"m-marketing-shell-announcement exact:[background:#eeedff] exact:[color:#37309b] exact:[border-bottom:1px_solid_#e0def8] exact:[font-size:12px] exact:[&>div]:flex exact:[&>div]:[justify-content:space-between] exact:[&>div]:items-center exact:[&>div]:flex-wrap exact:[&>div]:[gap:6px_24px] exact:[&>div]:[padding-block:10px] exact:[&_p]:[margin:0] exact:[&>div>div]:flex exact:[&>div>div]:items-center exact:[&>div>div]:flex-wrap exact:[&>div>div]:[gap:6px_16px] exact:[&_a]:inline-flex exact:[&_a]:items-center exact:[&_a]:[gap:4px] exact:[&_a]:[font-weight:700] exact:[&_a]:[text-underline-offset:4px] exact:[&_a:hover]:[text-decoration:underline] exact:[&_span]:[font-size:11px] exact:at-most-639:[&>div]:justify-center exact:at-most-639:[&>div]:text-center exact:at-most-639:[&>div]:[padding-block:9px] exact:at-most-639:[&>div>div]:justify-center exact:at-most-639:[&>div>div]:[gap:12px] exact:at-most-639:[&_p]:[font-size:11px] exact:at-most-639:[&_span]:[font-size:10px]"} aria-label="Trial and onboarding">
    <div className={"m-marketing-shell-container exact:[width:min(1184px,_calc(100%_-_64px))] exact:[margin-inline:auto] exact:at-most-639:[width:calc(100%_-_40px)]"}>
      <p>{SITE.announcement}</p>
      <div><Link href="/free-trial">Try Free Now <ArrowUpRight size={14} aria-hidden="true" /></Link><span>{SITE.trial.note}</span></div>
    </div>
  </aside>;
}
