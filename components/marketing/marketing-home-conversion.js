"use client";

import { ArrowRight, Check, MapPin, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { PLANS, PRICING, marketingPlanAmount } from "../../config/plans.js";
import MarketingContainer from "./marketing-container.js";
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
    <StorySection id="roles" className="bg-white">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <StoryHeading eyebrow={t("eyebrow")} title={t("title")}>
            {t("description")}
          </StoryHeading>
          <div className="mt-6">
            <StoryLink href="/demo">{t("exploreLink")}</StoryLink>
          </div>
        </div>

        <ol className="space-y-4">
          {roles.map(([title, subtitle, text], index) => (
            <li
              key={title}
              className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-6 transition-all hover:border-indigo-200 hover:bg-indigo-50/20"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>
                  <p className="text-xs font-medium text-indigo-600">{subtitle}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{text}</p>
            </li>
          ))}
        </ol>
      </div>

      <aside
        aria-labelledby="locations-title"
        className="mt-14 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/40 p-7 shadow-sm sm:p-10 lg:grid lg:grid-cols-[0.8fr_1.2fr] lg:gap-16"
      >
        <div>
          <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700">
            <MapPin size={15} aria-hidden="true" />
            <span>{t("locationEyebrow")}</span>
          </p>
          <h3 id="locations-title" className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {t("locationTitle")}
          </h3>
        </div>
        <div className="mt-4 lg:mt-0">
          <p className="text-base leading-relaxed text-slate-600">
            {t("locationDesc")}
          </p>
          <div className="mt-5">
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
    <StorySection id="how-it-works" className="border-t border-slate-200/80 bg-slate-50/50">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <StoryHeading eyebrow={t("eyebrow")} title={t("title")} />
        <StoryLink href="/guide">{t("guideLink")}</StoryLink>
      </div>

      <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(([title, text], index) => (
          <li
            key={title}
            className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-indigo-200 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="flex size-8 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-700">
                0{index + 1}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Step
              </span>
            </div>
            <h3 className="mt-5 text-base font-bold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
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
      <div className="mx-auto max-w-3xl text-center">
        <StoryHeading centered eyebrow={t("eyebrow")} title={t("title")}>
          {t("description")}
        </StoryHeading>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const amount = PRICING.pricesConfirmed ? marketingPlanAmount(plan) : null;
          return (
            <article
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-7 transition-all sm:p-8 ${
                plan.recommended
                  ? "border-indigo-500 bg-white shadow-xl shadow-indigo-600/10 ring-2 ring-indigo-500/20"
                  : "border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-white"
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-indigo-600 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs">
                    {t("recommendedBadge")}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
              </div>

              <p className="mt-2 min-h-12 text-sm leading-relaxed text-slate-600">
                {plan.description}
              </p>

              <div className="my-6 border-y border-slate-100 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {PRICING.currency} · {t("monthlyQuote")}
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                  {amount === null
                    ? PRICING.placeholderLabel
                    : `${new Intl.NumberFormat("en-PK").format(amount)} ${t("perMonth")}`}
                </p>
              </div>

              <ul className="mb-8 space-y-3">
                {plan.highlights.map((text) => (
                  <li key={text} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <Check size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-indigo-600" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              <MarketingShellAction
                href="/contact"
                variant={plan.recommended ? "primary" : "secondary"}
                className="mt-auto h-11 w-full text-sm font-semibold"
                aria-label={`Discuss ${plan.name} with Fitivo`}
              >
                <span>{t("discussPlan", { plan: plan.name })}</span>
                <ArrowRight size={15} aria-hidden="true" className="rtl:rotate-180" />
              </MarketingShellAction>
            </article>
          );
        })}
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-slate-500">
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
    <StorySection id="faq" className="border-t border-slate-200/80 bg-slate-50/50">
      <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
        <div>
          <StoryHeading eyebrow={t("eyebrow")} title={t("title")} />
          <div className="mt-6">
            <StoryLink href="/contact">{t("talkLink")}</StoryLink>
          </div>
        </div>

        <div className="divide-y divide-slate-200/90 rounded-2xl border border-slate-200/90 bg-white px-6 shadow-sm sm:px-8">
          {questions.map(([question, answer]) => (
            <details key={question} name="homepage-faq" className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-slate-900 transition-colors hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 [&::-webkit-details-marker]:hidden">
                <span>{question}</span>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-transform group-open:rotate-45 group-hover:bg-indigo-50 group-hover:text-indigo-600 motion-reduce:transition-none">
                  <Plus size={16} aria-hidden="true" />
                </span>
              </summary>
              <p className="mt-3 pr-8 text-sm leading-relaxed text-slate-600 rtl:pr-0 rtl:pl-8">
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
    <section id="start-trial" className="relative isolate overflow-hidden bg-slate-950 py-20 text-white sm:py-24">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(79,70,229,0.3),rgba(255,255,255,0))]"
      />

      <MarketingContainer>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-400">
            {t("eyebrow")}
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {t("title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            {t("description")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MarketingShellAction
              href="/register"
              className="h-12 w-full px-6 text-sm font-semibold shadow-lg shadow-indigo-600/30 sm:w-auto"
            >
              <span>{t("startTrial")}</span>
              <ArrowRight size={16} aria-hidden="true" className="rtl:rotate-180" />
            </MarketingShellAction>
            <MarketingShellAction
              href="/pricing"
              variant="secondary"
              className="h-12 w-full border-slate-700 bg-slate-900 px-6 text-sm font-semibold text-white hover:bg-slate-800 sm:w-auto"
            >
              <span>{t("viewPlans")}</span>
            </MarketingShellAction>
          </div>
        </div>
      </MarketingContainer>
    </section>
  );
}
