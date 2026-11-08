"use client";

import { ArrowRight, Check, MapPin, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { PLANS, PRICING, marketingPlanAmount } from "../../config/plans.js";
import MarketingShellAction from "./marketing-shell-action.js";
import { StoryHeading, StoryLink, StorySection } from "./marketing-story.js";

export function TeamAndLocations() {
  const t = useTranslations("marketing.teamAndLocations");

  const roles = [
    [t("role1Title"), t("role1Sub"), t("role1Desc")],
    [t("role2Title"), t("role2Sub"), t("role2Desc")],
    [t("role3Title"), t("role3Sub"), t("role3Desc")],
  ];

  return (
    <StorySection id="roles">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-20">
        <div>
          <StoryHeading eyebrow={t("eyebrow")} title={t("title")}>
            {t("description")}
          </StoryHeading>
          <div className="mt-6">
            <StoryLink href="/demo">{t("exploreLink")}</StoryLink>
          </div>
        </div>
        <ol className="divide-y divide-slate-200 border-y border-slate-200">
          {roles.map(([title, subtitle, text], index) => (
            <li key={title} className="flex gap-5 py-8">
              <span className="pt-1 text-xs font-semibold text-indigo-600">0{index + 1}</span>
              <div>
                <h3 className="text-xl font-medium tracking-tight text-slate-900">{title}</h3>
                <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
                <p className="mt-3 text-sm leading-7 text-slate-500">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <aside
        aria-labelledby="locations-title"
        className="mt-16 grid gap-7 rounded-2xl bg-indigo-50/60 p-7 sm:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16"
      >
        <div>
          <p className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            <MapPin size={14} aria-hidden="true" />
            {t("locationEyebrow")}
          </p>
          <h3 id="locations-title" className="text-3xl font-medium leading-tight tracking-tight text-slate-900">
            {t("locationTitle")}
          </h3>
        </div>
        <div>
          <p className="text-base leading-8 text-slate-600">
            {t("locationDesc")}
          </p>
          <div className="mt-4">
            <StoryLink href="/pricing">{t("locationLink")}</StoryLink>
          </div>
        </div>
      </aside>
    </StorySection>
  );
}

export function GettingStarted() {
  const t = useTranslations("marketing.gettingStarted");

  const steps = [
    [t("step1Title"), t("step1Desc")],
    [t("step2Title"), t("step2Desc")],
    [t("step3Title"), t("step3Desc")],
    [t("step4Title"), t("step4Desc")],
  ];

  return (
    <StorySection id="how-it-works" className="bg-slate-50">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <StoryHeading eyebrow={t("eyebrow")} title={t("title")} />
        <StoryLink href="/guide">{t("guideLink")}</StoryLink>
      </div>
      <ol className="mt-14 grid gap-8 md:grid-cols-4 md:gap-0">
        {steps.map(([title, text], index) => (
          <li
            key={title}
            className="relative border-l rtl:border-l-0 rtl:border-r border-slate-200 pl-6 rtl:pl-0 rtl:pr-6 md:border-l-0 md:rtl:border-r-0 md:border-t md:pl-0 md:pr-6 rtl:md:pr-0 rtl:md:pl-6 md:pt-8"
          >
            <span className="relative -ml-11 rtl:-mr-11 rtl:ml-0 mb-4 grid size-10 place-items-center rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-indigo-600 md:absolute md:-top-5 md:ml-0 rtl:md:mr-0">
              0{index + 1}
            </span>
            <h3 className="text-base font-semibold leading-6 text-slate-900">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">{text}</p>
          </li>
        ))}
      </ol>
    </StorySection>
  );
}

export function PricingPreview() {
  const t = useTranslations("marketing.pricingPreview");

  return (
    <StorySection id="pricing" className="bg-white">
      <StoryHeading eyebrow={t("eyebrow")} title={t("title")}>
        {t("description")}
      </StoryHeading>
      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const amount = PRICING.pricesConfirmed ? marketingPlanAmount(plan) : null;
          return (
            <article
              key={plan.id}
              className={`flex flex-col rounded-2xl border bg-slate-50/50 p-6 sm:p-8 ${
                plan.recommended
                  ? "border-indigo-300 bg-indigo-50/40 shadow-lg shadow-indigo-600/5"
                  : "border-slate-200"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                {plan.recommended && (
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                    {t("recommendedBadge")}
                  </span>
                )}
              </div>
              <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{plan.description}</p>
              <p className="mt-6 text-xs font-medium uppercase tracking-widest text-slate-500">
                {PRICING.currency} · {t("monthlyQuote")}
              </p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                {amount === null ? PRICING.placeholderLabel : `${new Intl.NumberFormat("en-PK").format(amount)} ${t("perMonth")}`}
              </p>
              <ul className="mb-8 mt-7 space-y-3">
                {plan.highlights.map((text) => (
                  <li key={text} className="flex gap-2 text-sm leading-6 text-slate-600">
                    <Check size={16} aria-hidden="true" className="mt-1 shrink-0 text-indigo-600" />
                    {text}
                  </li>
                ))}
              </ul>
              <MarketingShellAction
                href="/contact"
                variant={plan.recommended ? "primary" : "secondary"}
                className="mt-auto"
                aria-label={`Discuss ${plan.name} with Fitivo`}
              >
                {t("discussPlan", { plan: plan.name })}
                <ArrowRight size={16} aria-hidden="true" className="rtl:rotate-180" />
              </MarketingShellAction>
            </article>
          );
        })}
      </div>
      <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-6 text-slate-500">
        {t("disclaimer")}
      </p>
      <div className="mt-4 text-center">
        <StoryLink href="/pricing">{t("compareLink")}</StoryLink>
      </div>
    </StorySection>
  );
}

export function HomepageFaq() {
  const t = useTranslations("marketing.faq");

  const questions = [
    [t("q1"), t("a1")],
    [t("q2"), t("a2")],
    [t("q3"), t("a3")],
    [t("q4"), t("a4")],
    [t("q5"), t("a5")],
    [t("q6"), t("a6")],
    [t("q7"), t("a7")],
  ];

  return (
    <StorySection id="faq" className="bg-slate-50">
      <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
        <div>
          <StoryHeading eyebrow={t("eyebrow")} title={t("title")} />
          <div className="mt-5">
            <StoryLink href="/contact">{t("talkLink")}</StoryLink>
          </div>
        </div>
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {questions.map(([question, answer]) => (
            <details key={question} name="homepage-faq" className="group">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-5 text-base font-medium text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600 [&::-webkit-details-marker]:hidden">
                {question}
                <Plus
                  size={18}
                  aria-hidden="true"
                  className="shrink-0 text-indigo-600 transition-transform group-open:rotate-45 motion-reduce:transition-none"
                />
              </summary>
              <p className="max-w-2xl pb-6 pr-6 rtl:pr-0 rtl:pl-6 text-sm leading-7 text-slate-600">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </StorySection>
  );
}

export function HomepageClosing() {
  const t = useTranslations("marketing.closing");

  return (
    <StorySection id="start-trial" className="bg-slate-900 text-white">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-center lg:gap-16">
        <StoryHeading inverse eyebrow={t("eyebrow")} title={t("title")}>
          {t("description")}
        </StoryHeading>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <MarketingShellAction href="/register" className="min-h-12">
            {t("startTrial")}
            <ArrowRight size={16} aria-hidden="true" className="rtl:rotate-180" />
          </MarketingShellAction>
          <MarketingShellAction href="/pricing" variant="secondary" className="min-h-12 text-slate-900!">
            {t("viewPlans")}
          </MarketingShellAction>
        </div>
      </div>
    </StorySection>
  );
}
