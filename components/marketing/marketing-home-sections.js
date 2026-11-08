"use client";

import { ArrowRight, CalendarCheck, CheckCircle2, CreditCard, FileChartColumn, Receipt, Users, WalletCards } from "lucide-react";
import { useTranslations } from "next-intl";
import MarketingContainer from "./marketing-container.js";
import { ProductCrop, StoryHeading, StoryLink, StorySection } from "./marketing-story.js";

export function CapabilityStrip() {
  const t = useTranslations("marketing.capabilities");

  const capabilities = [
    [Users, t("members")],
    [WalletCards, t("memberships")],
    [CreditCard, t("payments")],
    [CalendarCheck, t("attendance")],
    [FileChartColumn, t("reports")],
  ];

  return (
    <div id="features" className="scroll-mt-24 border-b border-slate-200/80 bg-white py-6">
      <MarketingContainer className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500 lg:text-left rtl:lg:text-right">
          {t("eyebrow")}
        </p>
        <ul aria-label="Fitivo capabilities" className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 lg:gap-10">
          {capabilities.map(([Icon, label]) => (
            <li key={label} className="flex items-center gap-2 text-xs font-semibold text-slate-700 sm:text-sm">
              <span className="flex size-7 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                <Icon size={16} strokeWidth={2} aria-hidden="true" />
              </span>
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </MarketingContainer>
    </div>
  );
}

export function ConnectedWorkflow() {
  const t = useTranslations("marketing.workflow");

  const workflow = [
    [t("step1Title"), t("step1Text")],
    [t("step2Title"), t("step2Text")],
    [t("step3Title"), t("step3Text")],
    [t("step4Title"), t("step4Text")],
  ];

  return (
    <StorySection id="connected-day" className="bg-white">
      <div className="grid gap-7 lg:grid-cols-[1.3fr_0.8fr] lg:items-end lg:gap-16">
        <StoryHeading eyebrow={t("eyebrow")} title={t("title")} />
        <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
          {t("description")}
        </p>
      </div>

      <div className="mt-12 grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5 lg:grid-cols-[0.8fr_1.2fr]">
        {/* The Disconnected Day */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-6 sm:p-10 lg:border-b-0 lg:border-r rtl:lg:border-r-0 rtl:lg:border-l">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
            {t("disconnectedTitle")}
          </p>
          <ul className="mt-6 space-y-4">
            {[t("disconnectedItem1"), t("disconnectedItem2"), t("disconnectedItem3")].map((text) => (
              <li key={text} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-rose-400" aria-hidden="true" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 border-t border-slate-200 pt-5 text-xs font-medium text-slate-500">
            {t("disconnectedFootnote")}
          </p>
        </div>

        {/* The Connected Day */}
        <div className="p-6 sm:p-10">
          <p className="text-xl font-bold tracking-tight text-slate-900">
            {t("connectedTitle")}
          </p>
          <ol className="mt-6 grid gap-4 sm:grid-cols-4">
            {workflow.map(([title, text], index) => (
              <li
                key={title}
                className="relative rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition-all hover:border-indigo-200 hover:bg-indigo-50/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600">0{index + 1}</span>
                  {index < 3 && (
                    <ArrowRight size={13} aria-hidden="true" className="hidden text-slate-300 sm:block rtl:rotate-180" />
                  )}
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900">{title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-slate-500">{text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <StoryLink href="/features">{t("learnMore")}</StoryLink>
          </div>
        </div>
      </div>
    </StorySection>
  );
}

export function MemberStory() {
  const t = useTranslations("marketing.memberStory");

  return (
    <StorySection id="member-workflow" className="border-t border-slate-200/80 bg-slate-50/50">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <StoryHeading eyebrow={t("eyebrow")} title={t("title")} />
        <StoryLink href="/features#member-management">{t("exploreLink")}</StoryLink>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm transition-all hover:shadow-md sm:p-9">
          <div className="inline-flex items-center gap-2 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
            <Users size={15} aria-hidden="true" />
            <span>{t("managementBadge")}</span>
          </div>
          <h3 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {t("managementTitle")}
          </h3>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            {t("managementDesc")}
          </p>
          <ul className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5 text-xs font-medium text-slate-700">
            {[t("tagDetails"), t("tagHistory"), t("tagPayments"), t("tagVisits")].map((text) => (
              <li key={text} className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1">
                <CheckCircle2 size={13} className="text-indigo-600" aria-hidden="true" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-200/90 bg-white p-7 shadow-sm transition-all hover:shadow-md sm:p-9">
          <div className="inline-flex items-center gap-2 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
            <WalletCards size={15} aria-hidden="true" />
            <span>{t("membershipsBadge")}</span>
          </div>
          <h3 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {t("membershipsTitle")}
          </h3>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            {t("membershipsDesc")}
          </p>
          <div className="mt-8 border-t border-slate-100 pt-5">
            <StoryLink href="/features#memberships">{t("membershipsLink")}</StoryLink>
          </div>
        </article>
      </div>
    </StorySection>
  );
}

export function MembershipPayments() {
  const t = useTranslations("marketing.feesFinance");

  return (
    <StorySection id="fees-finance" className="bg-slate-900 text-white">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-16">
        <StoryHeading inverse eyebrow={t("eyebrow")} title={t("title")} />
        <div>
          <p className="text-base leading-relaxed text-slate-300">
            {t("description")}
          </p>
          <div className="mt-6">
            <StoryLink inverse href="/features#fees">{t("exploreLink")}</StoryLink>
          </div>
        </div>
      </div>

      <ProductCrop
        inverse
        className="mt-12"
        label={t("workspaceLabel")}
        src="/home-payments.webp"
        width={1535}
        height={365}
        alt="Fitivo payments overview with collection totals, dues and payment search filters in an empty-state capture."
        caption={t("caption")}
      />

      <ul className="mt-8 grid gap-4 border-t border-white/10 pt-7 sm:grid-cols-2 lg:grid-cols-4">
        {[t("tag1"), t("tag2"), t("tag3"), t("tag4")].map((text) => (
          <li key={text} className="flex items-center gap-3 rounded-lg bg-white/5 px-3.5 py-2.5 text-xs font-medium text-slate-200">
            <Receipt size={16} aria-hidden="true" className="shrink-0 text-indigo-400" />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </StorySection>
  );
}

export function AttendanceStory() {
  const t = useTranslations("marketing.attendanceStory");

  return (
    <StorySection id="attendance" className="bg-white">
      <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <StoryHeading eyebrow={t("eyebrow")} title={t("title")}>
            {t("description")}
          </StoryHeading>
          <ol className="mt-8 space-y-3">
            {[t("step1"), t("step2"), t("step3")].map((text, index) => (
              <li
                key={text}
                className="flex items-center gap-3.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-sm font-medium text-slate-700"
              >
                <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                  0{index + 1}
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="min-w-0 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5 sm:p-8">
          <ProductCrop
            label={t("checkInLabel")}
            src="/home-check-in.webp"
            width={1535}
            height={185}
            alt="Fitivo member check-in search with a field for member name or phone number."
            caption={t("checkInCaption")}
          />
          <div className="mt-6 flex items-center gap-2.5 text-xs font-semibold text-slate-600">
            <CalendarCheck size={16} className="text-indigo-600" aria-hidden="true" />
            <span>{t("connectedFooter")}</span>
          </div>
        </div>
      </div>
    </StorySection>
  );
}

export function OwnerVisibility() {
  const t = useTranslations("marketing.ownerVisibility");

  const items = [
    [t("collectionsTitle"), t("collectionsDesc")],
    [t("membershipsTitle"), t("membershipsDesc")],
    [t("attendanceTitle"), t("attendanceDesc")],
  ];

  return (
    <StorySection id="reports" className="border-t border-slate-200/80 bg-slate-50/50">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <StoryHeading eyebrow={t("eyebrow")} title={t("title")}>
            {t("description")}
          </StoryHeading>
          <div className="mt-6">
            <StoryLink href="/features#reports">{t("exploreLink")}</StoryLink>
          </div>
        </div>

        <dl className="divide-y divide-slate-200 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
          {items.map(([title, text], index) => (
            <div key={title} className="py-5 first:pt-0 last:pb-0">
              <dt className="flex items-center gap-3 text-base font-bold text-slate-900">
                <span className="flex size-6 items-center justify-center rounded-md bg-indigo-50 text-xs font-bold text-indigo-600">
                  0{index + 1}
                </span>
                <span>{title}</span>
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-600 ltr:pl-9 rtl:pr-9">
                {text}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <ProductCrop
        className="mt-12"
        label={t("periodsLabel")}
        src="/home-report-filters.webp"
        width={1535}
        height={125}
        alt="Fitivo report period controls with preset and custom periods and a monthly chart interval."
        caption={t("periodsCaption")}
      />
    </StorySection>
  );
}
