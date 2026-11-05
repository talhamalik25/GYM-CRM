import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SITE } from "../../config/site.js";
import { MarketingBrand } from "./marketing-primitives.js";
import MarketingContainer from "./marketing-container.js";

const groups = [
  ["Product", [["Features", "/features"], ["Pricing", "/pricing"], ["Product Tour", "/demo"]]],
  ["Resources", [["Guide", "/guide"], ["Contact", "/contact"]]],
  ["Company", [["About", "/about"]]],
  ["Account", [["Log in", "/login"], ["Start trial", "/register"]]],
  ["Legal", [["Privacy", "/privacy"], ["Terms", "/terms"]]],
];
const linkClass = "inline-flex min-h-11 items-center text-sm text-slate-600 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600";

export default function MarketingFooter() {
  return <footer className="border-t border-slate-200 bg-white pb-6 pt-14 sm:pt-16"><MarketingContainer>
    <div className="grid gap-10 pb-10 xl:grid-cols-[1fr_2fr] xl:gap-16">
      <div><MarketingBrand /><p className="mt-5 text-base font-medium text-slate-900">{SITE.tagline}</p><p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">{SITE.description}</p><address className="mt-4 flex flex-col items-start not-italic"><a className={linkClass} href={`mailto:${SITE.email}`}>{SITE.email}</a><a className={linkClass} href={SITE.phoneHref}>{SITE.phone}</a><span className="mt-2 text-xs text-slate-500">{SITE.location}</span></address></div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-5">{groups.map(([title, links]) => <nav key={title} aria-label={`Footer ${title}`}><h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-900">{title}</h2><ul>{links.map(([label, href]) => <li key={href}><Link href={href} className={linkClass}>{label}</Link></li>)}</ul></nav>)}</div>
    </div>
    <div className="flex flex-col justify-between gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center"><span>© {new Date().getFullYear()} {SITE.name}</span><a href={SITE.companyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600">A product by {SITE.company}<ArrowUpRight size={14} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a></div>
  </MarketingContainer></footer>;
}
