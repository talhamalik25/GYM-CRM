"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { SITE } from "../../config/site.js";
import { MarketingBrand } from "./marketing-primitives.js";
import MarketingContainer from "./marketing-container.js";

const linkClass =
  "inline-flex py-1.5 text-sm text-slate-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 motion-reduce:transition-none";

export default function MarketingFooter() {
  const t = useTranslations("marketing.footer");

  const explore = [
    [t("features"), "/features"],
    [t("pricing"), "/pricing"],
    [t("productTour"), "/demo"],
    [t("guide"), "/guide"],
    [t("startTrial"), "/register"],
    [t("login"), "/login"],
  ];

  return (
    <footer className="border-t border-slate-800 bg-slate-950 pb-12 pt-16 text-white sm:pt-20">
      <MarketingContainer>
        <div className="grid gap-12 pb-14 md:grid-cols-[1.4fr_1fr_1fr] md:gap-16">
          <div>
            <MarketingBrand inverse />
            <p className="mt-5 text-xl font-bold tracking-tight text-white sm:text-2xl">
              {t("tagline")}
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
              {t("subtext")}
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Engineered by AKTech Digital Solutions</span>
            </div>
          </div>

          <nav aria-label="Footer Explore Fitivo">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-300">
              {t("exploreTitle")}
            </h2>
            <ul className="space-y-1">
              {explore.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <nav aria-label="Footer Company and Support">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-300">
                {t("companyTitle")}
              </h2>
              <ul className="space-y-1">
                <li>
                  <Link href="/about" className={linkClass}>
                    {t("about")}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className={linkClass}>
                    {t("contact")}
                  </Link>
                </li>
              </ul>
            </nav>

            <address className="mt-6 flex flex-col items-start not-italic text-sm text-slate-400">
              <a className={linkClass} href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>
              <a className={linkClass} href={SITE.phoneHref}>
                {SITE.phone}
              </a>
              <span className="mt-2 text-xs text-slate-500">{SITE.location}</span>
            </address>
          </div>
        </div>

        {/* Legal & copyright strip */}
        <div className="flex flex-col justify-between gap-4 border-t border-slate-800/80 pt-8 text-xs text-slate-500 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              {t("privacy") || "Privacy"}
            </Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              {t("terms") || "Terms"}
            </Link>
            <a
              href={SITE.companyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-slate-300 transition-colors"
            >
              <span>{t("productBy", { company: SITE.company })}</span>
              <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          </div>
        </div>
      </MarketingContainer>
    </footer>
  );
}
