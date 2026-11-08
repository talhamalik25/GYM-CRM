"use client";

import Image from "next/image";
import { ArrowRight, ArrowUpRight, CalendarCheck, Check, CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
import MarketingContainer from "./marketing-container.js";
import MarketingShellAction from "./marketing-shell-action.js";

export default function MarketingHero() {
  const t = useTranslations("marketing.hero");

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden border-b border-slate-200 bg-slate-50/50 pb-10 pt-10 sm:pb-14 sm:pt-14 lg:pt-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-60 -z-10 mx-auto h-96 max-w-4xl rounded-full bg-indigo-100/30 blur-3xl" />
      <MarketingContainer>
        <div className="mx-auto max-w-4xl text-center">
          <p className="flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-700 sm:text-xs">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-indigo-600" />
            {t("badge")}
          </p>
          <h1 id="hero-title" className="mt-5 text-[42px] font-bold leading-[1.08] tracking-[-0.045em] text-slate-900 sm:text-[56px] lg:text-[72px]">
            {t("titleLine1")}<br />One <span className="text-indigo-600">{t("titleLine2")}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-[700px] text-[17px] leading-relaxed text-slate-600 sm:text-lg">
            {t("description")}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <MarketingShellAction href="/register" className="min-h-12 px-6 transition-[transform,box-shadow,background-color] duration-150 hover:shadow-md hover:shadow-indigo-600/20 motion-safe:hover:-translate-y-px motion-safe:hover:[&_svg]:translate-x-[3px] rtl:motion-safe:hover:[&_svg]:-translate-x-[3px]">
              {t("startTrial")} <ArrowRight size={16} aria-hidden="true" className="rtl:rotate-180" />
            </MarketingShellAction>
            <MarketingShellAction href="/demo" variant="secondary" className="min-h-12 px-6 hover:border-slate-400 [&_svg]:transition-transform motion-reduce:[&_svg]:transition-none motion-safe:hover:[&_svg]:translate-x-0.5 motion-safe:hover:[&_svg]:-translate-y-0.5 rtl:motion-safe:hover:[&_svg]:-translate-x-0.5">
              {t("explorePlatform")} <ArrowUpRight size={16} aria-hidden="true" className="rtl:-scale-x-100" />
            </MarketingShellAction>
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <Check size={13} aria-hidden="true" /> {t("trialBadge")}
          </p>
        </div>

        <div id="product" tabIndex={-1} className="relative mx-auto mt-12 max-w-[1100px] scroll-mt-28 lg:mt-16 lg:pb-20">
          <div className="mb-4 flex items-center justify-between gap-3 text-[10px] uppercase tracking-widest text-slate-500">
            <span className="font-semibold">{t("insideFitivo")}</span>
            <span>{t("realProductCaptures")}</span>
          </div>
          <figure className="overflow-hidden rounded-[20px] border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10 lg:mr-16 rtl:lg:mr-0 rtl:lg:ml-16">
            <div className="flex items-center justify-between px-3 pb-3 pt-2 text-xs">
              <span className="font-semibold text-slate-900">{t("attendanceTitle")}</span>
              <CalendarCheck size={15} aria-hidden="true" className="text-slate-400" />
            </div>
            <div className="h-[350px] overflow-hidden rounded-xl border border-slate-100 bg-slate-50 sm:h-[400px] lg:h-[440px]">
              <Image src="/hero-attendance.webp" alt="Fitivo attendance screen with member search, daily attendance totals and an empty visit list." width={1565} height={740} priority sizes="(max-width: 639px) 931px, 1100px" className="h-[440px] w-auto max-w-none sm:h-auto sm:w-[1100px]" />
            </div>
            <figcaption className="px-3 pb-1 pt-3 text-[11px] text-slate-500">{t("attendanceCaption")}</figcaption>
          </figure>
          <figure className="absolute -right-4 rtl:-left-4 rtl:right-auto bottom-0 hidden w-[410px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10 lg:block">
            <div className="flex items-center justify-between px-2 pb-3 pt-1 text-[11px] text-slate-600">
              <span>{t("paymentsTitle")}</span>
              <CreditCard size={14} aria-hidden="true" />
            </div>
            <div className="overflow-hidden rounded-lg">
              <Image src="/home-payments.webp" alt="Fitivo payment overview with collection totals, dues and search filters in an empty-state capture." width={1535} height={365} sizes="620px" className="h-auto w-[620px] max-w-none" />
            </div>
            <figcaption className="px-2 pt-2 text-[10px] text-slate-500">{t("paymentsCaption")}</figcaption>
          </figure>
        </div>
      </MarketingContainer>
    </section>
  );
}
