"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { SITE } from "../../config/site.js";
import { MarketingBrand } from "./marketing-primitives.js";
import MarketingContainer from "./marketing-container.js";

const linkClass =
  "inline-flex min-h-11 items-center text-sm text-slate-300! transition-colors hover:text-white! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-300 motion-reduce:transition-none";

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
    <footer className="border-t border-white/10 bg-slate-950 pb-6 pt-14 text-white sm:pt-16">
      <MarketingContainer>
        <div className="grid gap-10 pb-12 md:grid-cols-[1.4fr_1fr_1fr] md:gap-16">
          <div>
            <MarketingBrand inverse />
            <p className="mt-6 text-2xl font-medium leading-tight tracking-tight">
              {t("tagline")}
            </p>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">
              {t("subtext")}
            </p>
          </div>
          <nav aria-label="Footer Explore Fitivo">
            <h2 className="mb-4 text-xs font-semibold text-white">{t("exploreTitle")}</h2>
            <ul>
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
              <h2 className="mb-4 text-xs font-semibold text-white">{t("companyTitle")}</h2>
              <ul>
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
            <address className="flex flex-col items-start not-italic">
              <a className={linkClass} href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>
              <a className={linkClass} href={SITE.phoneHref}>
                {SITE.phone}
              </a>
              <span className="mt-3 text-xs text-slate-400">{SITE.location}</span>
            </address>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-4 border-t border-white/10 pt-5 text-xs text-slate-400 lg:flex-row lg:items-center">
          <span>© {new Date().getFullYear()} {SITE.name}</span>
          <a
            href={SITE.companyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            {t("productBy", { company: SITE.company })}
            <ArrowUpRight size={14} aria-hidden="true" className="ml-1.5 rtl:mr-1.5 rtl:ml-0 rtl:-scale-x-100" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <nav aria-label="Legal information" className="flex gap-5">
            <Link href="/privacy" className={linkClass}>
              {t("privacy")}
            </Link>
            <Link href="/terms" className={linkClass}>
              {t("terms")}
            </Link>
          </nav>
        </div>
      </MarketingContainer>
    </footer>
  );
}
