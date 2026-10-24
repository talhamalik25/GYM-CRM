import Link from "next/link";
import { ArrowUp, Zap } from "lucide-react";
import { MARKETING_SUPPORT_CHANNEL } from "../../lib/marketingConfig.js";

function Brand() {
  return <Link href="/" aria-label="Fitivo home" className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-white">
    <span className="grid size-8 place-items-center rounded-[10px] bg-indigo-500 text-white"><Zap size={18} strokeWidth={2.25} aria-hidden="true" /></span>
    <span>Fitivo</span>
  </Link>;
}

const exploreLinks = [["Features", "#features"], ["How it works", "#how-it-works"], ["Pricing", "#pricing"], ["FAQ", "#faq"]];

export default function MarketingFooter({ trialAvailable }) {
  const contactHref = MARKETING_SUPPORT_CHANNEL?.href || "/login";
  const external = contactHref.startsWith("https:");

  return <footer className="bg-slate-950 px-5 pt-12 text-white">
    <div className="mx-auto grid max-w-6xl gap-9 pb-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_.7fr_.7fr_1fr]">
      <div><Brand/><p className="mt-3 max-w-xs text-xs leading-5 text-slate-400">Gym management that keeps your business moving.</p></div>
      <div className="grid content-start gap-3 text-[11px] text-slate-400"><b className="mb-1 text-xs text-white">Explore</b>{exploreLinks.map(([label, href]) => <a key={href} href={href} className="w-fit hover:text-white">{label}</a>)}</div>
      <div className="grid content-start gap-3 text-[11px] text-slate-400"><b className="mb-1 text-xs text-white">Your account</b>{trialAvailable && <Link href="/register" className="w-fit hover:text-white">Start free trial</Link>}<Link href="/login" className="w-fit hover:text-white">Log in</Link></div>
      <div><b className="text-xs">Contact</b><p className="mt-3 text-[11px] leading-5 text-slate-400">{MARKETING_SUPPORT_CHANNEL ? "For account access or support, contact Fitivo." : "No public support channel is configured. Sign in to your account for help."}</p>{MARKETING_SUPPORT_CHANNEL && <a href={contactHref} target={external ? "_blank" : undefined} rel={external ? "noreferrer noopener" : undefined} className="mt-3 inline-flex min-h-10 items-center rounded-[10px] bg-white/10 px-3 text-[11px] font-semibold text-white hover:bg-white/15">Request access</a>}</div>
    </div>
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-white/10 py-5 text-[10px] text-slate-500"><span>© {new Date().getFullYear()} Fitivo. All rights reserved.</span><a href="#home" className="inline-flex items-center gap-1.5 hover:text-white">Back to top<ArrowUp size={12} aria-hidden="true" /></a></div>
  </footer>;
}
