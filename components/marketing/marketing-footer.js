import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SITE } from "../../config/site.js";
import { MarketingBrand } from "./marketing-primitives.js";
import MarketingContainer from "./marketing-container.js";

const explore = [["Features", "/features"], ["Plans & Pricing", "/pricing"], ["Product Tour", "/demo"], ["Guide", "/guide"], ["Start Trial", "/register"], ["Log in", "/login"]];
const linkClass = "inline-flex min-h-11 items-center text-sm text-slate-300! transition-colors hover:text-white! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-300 motion-reduce:transition-none";

export default function MarketingFooter() {
  return <footer className="border-t border-white/10 bg-slate-950 pb-6 pt-14 text-white sm:pt-16"><MarketingContainer>
    <div className="grid gap-10 pb-12 md:grid-cols-[1.4fr_1fr_1fr] md:gap-16">
      <div><MarketingBrand inverse /><p className="mt-6 text-2xl font-medium leading-tight tracking-tight">Your gym day.<br />Better connected.</p><p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">Members, memberships, payments and daily gym operations in one connected system.</p></div>
      <nav aria-label="Footer Explore Fitivo"><h2 className="mb-4 text-xs font-semibold text-white">Explore Fitivo</h2><ul>{explore.map(([label, href]) => <li key={href}><Link href={href} className={linkClass}>{label}</Link></li>)}</ul></nav>
      <div><nav aria-label="Footer Company and Support"><h2 className="mb-4 text-xs font-semibold text-white">Company / Support</h2><ul><li><Link href="/about" className={linkClass}>About</Link></li><li><Link href="/contact" className={linkClass}>Contact</Link></li></ul></nav><address className="flex flex-col items-start not-italic"><a className={linkClass} href={`mailto:${SITE.email}`}>{SITE.email}</a><a className={linkClass} href={SITE.phoneHref}>{SITE.phone}</a><span className="mt-3 text-xs text-slate-400">{SITE.location}</span></address></div>
    </div>
    <div className="flex flex-col justify-between gap-4 border-t border-white/10 pt-5 text-xs text-slate-400 lg:flex-row lg:items-center"><span>© {new Date().getFullYear()} {SITE.name}</span><a href={SITE.companyUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>A product by {SITE.company}<ArrowUpRight size={14} aria-hidden="true" className="ml-1.5" /><span className="sr-only"> (opens in a new tab)</span></a><nav aria-label="Legal information" className="flex gap-5"><Link href="/privacy" className={linkClass}>Privacy</Link><Link href="/terms" className={linkClass}>Terms</Link></nav></div>
  </MarketingContainer></footer>;
}
