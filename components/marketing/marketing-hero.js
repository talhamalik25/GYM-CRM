"use client";

import Image from "next/image";
import { ArrowRight, ArrowUpRight, CalendarCheck, Check, CreditCard, Sparkles, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import MarketingContainer from "./marketing-container.js";
import MarketingShellAction from "./marketing-shell-action.js";

export default function MarketingHero() {
  const t = useTranslations("marketing.hero");

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/40 to-slate-100/50 pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20"
    >
      {/* Subtle modern ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl opacity-50"
      >
        <div className="h-[340px] w-[680px] bg-gradient-to-tr from-indigo-200/50 via-indigo-100/40 to-transparent rounded-full" />
      </div>

      <MarketingContainer>
        {/* Hero headline & copy */}
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-3.5 py-1 text-xs font-semibold text-indigo-700 shadow-xs backdrop-blur-xs">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-indigo-400 opacity-75 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-indigo-600" />
            </span>
            <span className="tracking-wide uppercase text-[11px]">{t("badge")}</span>
          </div>

          <h1
            id="hero-title"
            className="mt-6 text-[40px] font-bold leading-[1.08] tracking-[-0.04em] text-slate-900 sm:text-[56px] lg:text-[68px]"
          >
            {t("titleLine1")}{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
              One {t("titleLine2")}
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-[680px] text-base leading-relaxed text-slate-600 sm:text-lg lg:text-[19px]">
            {t("description")}
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MarketingShellAction
              href="/register"
              className="h-12 w-full px-6 text-sm font-semibold shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 motion-safe:hover:-translate-y-0.5 sm:w-auto"
            >
              <span>{t("startTrial")}</span>
              <ArrowRight size={16} aria-hidden="true" className="rtl:rotate-180" />
            </MarketingShellAction>

            <MarketingShellAction
              href="/demo"
              variant="secondary"
              className="h-12 w-full px-6 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 motion-safe:hover:-translate-y-0.5 sm:w-auto"
            >
              <span>{t("explorePlatform")}</span>
              <ArrowUpRight size={16} aria-hidden="true" className="rtl:-scale-x-100" />
            </MarketingShellAction>
          </div>

          {/* Trust reassurance microcopy */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Check size={14} className="text-emerald-600" aria-hidden="true" />
              {t("trialBadge")}
            </span>
            <span className="hidden text-slate-300 sm:inline" aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-indigo-600" aria-hidden="true" />
              Pakistan-ready gym workflows
            </span>
          </div>
        </div>

        {/* Product showcase preview frame */}
        <div
          id="product"
          tabIndex={-1}
          className="relative mx-auto mt-14 max-w-[1100px] scroll-mt-28 lg:mt-18"
        >
          {/* Subtle browser mockup shell */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12)]">
            {/* Window bar controls */}
            <div className="flex h-11 items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-slate-300" />
                <span className="size-2.5 rounded-full bg-slate-300" />
                <span className="size-2.5 rounded-full bg-slate-300" />
                <span className="ml-3 hidden text-[11px] font-medium text-slate-400 sm:inline">
                  fitivo.app/workspace
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Live Preview
                </span>
                <span className="hidden sm:inline text-slate-400">|</span>
                <span className="hidden uppercase tracking-wider text-[10px] text-slate-400 sm:inline">
                  {t("insideFitivo")}
                </span>
              </div>
            </div>

            {/* Product image container */}
            <div className="relative overflow-hidden bg-slate-900/5">
              <Image
                src="/dashboard.png"
                alt="Fitivo gym owner dashboard preview showcasing members, revenue, daily attendance and gym operations."
                width={1904}
                height={1065}
                priority
                sizes="(max-width: 1024px) 100vw, 1100px"
                className="h-auto w-full object-cover object-top"
              />
            </div>

            {/* Bottom preview footnote */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[11px] text-slate-500">
              <span className="flex items-center gap-2">
                <CalendarCheck size={14} className="text-indigo-600" aria-hidden="true" />
                <span>{t("attendanceTitle")}</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">
                {t("realProductCaptures")}
              </span>
            </div>
          </div>

          {/* Floating contextual card: Payments overview */}
          <figure className="absolute -bottom-6 -right-6 hidden w-[360px] overflow-hidden rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-2xl shadow-slate-900/15 lg:block rtl:-left-6 rtl:-right-auto">
            <div className="flex items-center justify-between px-2 pb-2 text-xs font-semibold text-slate-800">
              <span className="flex items-center gap-1.5">
                <CreditCard size={14} className="text-indigo-600" aria-hidden="true" />
                <span>{t("paymentsTitle")}</span>
              </span>
              <span className="text-[10px] font-normal text-slate-400">Overview</span>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
              <Image
                src="/home-payments.webp"
                alt="Fitivo payments overview preview with collections and balances."
                width={1535}
                height={365}
                sizes="340px"
                className="h-auto w-full object-cover"
              />
            </div>
            <figcaption className="px-2 pt-2 text-[10px] text-slate-500">
              {t("paymentsCaption")}
            </figcaption>
          </figure>
        </div>
      </MarketingContainer>
    </section>
  );
}
