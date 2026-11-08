"use client";

import { ArrowRight, CalendarCheck, CreditCard, FileChartColumn, Receipt, Users, WalletCards } from "lucide-react";
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
    <div id="features" className="scroll-mt-28 border-y border-slate-200 bg-white py-7">
      <MarketingContainer className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-center text-sm font-medium leading-6 text-slate-900 lg:text-left rtl:lg:text-right">
          {t("eyebrow")}
        </p>
        <ul aria-label="Fitivo capabilities" className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4 lg:gap-9">
          {capabilities.map(([Icon, label]) => (
            <li key={label} className="flex items-center gap-2 text-xs font-medium text-slate-600 sm:text-sm">
              <Icon size={18} strokeWidth={1.5} aria-hidden="true" className="text-slate-400" />
              {label}
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
    <StorySection id="connected-day">
      <div className="grid gap-7 lg:grid-cols-[1.3fr_0.8fr] lg:items-end lg:gap-20">
        <StoryHeading
          eyebrow={t("eyebrow")}
          title={
            <>
              {t("title")}
            </>
          }
        />
        <p className="text-base leading-8 text-slate-500 sm:text-[17px]">
          {t("description")}
        </p>
      </div>
      <div className="mt-12 grid overflow-hidden rounded-2xl border border-slate-200 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="bg-slate-50 p-6 sm:p-10">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {t("disconnectedTitle")}
          </p>
          <ul className="mt-7 space-y-5">
            {[t("disconnectedItem1"), t("disconnectedItem2"), t("disconnectedItem3")].map((text) => (
              <li key={text} className="flex items-center gap-3 text-sm leading-6 text-slate-600">
                <span className="size-1 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
          <p className="mt-8 border-t border-slate-200 pt-5 text-xs text-slate-500">
            {t("disconnectedFootnote")}
          </p>
        </div>
        <div className="bg-white p-6 sm:p-10">
          <p className="text-xl font-semibold tracking-tight text-slate-900">
            {t("connectedTitle")}
          </p>
          <ol className="mt-7 grid gap-3 sm:grid-cols-4 sm:gap-4">
            {workflow.map(([title, text], index) => (
              <li key={title}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-indigo-600">0{index + 1}</span>
                  {index < 3 && <ArrowRight size={14} aria-hidden="true" className="hidden text-slate-300 sm:block rtl:rotate-180" />}
                </div>
                <h3 className="mt-2 text-sm font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">{text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-7">
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
    <StorySection id="member-workflow" className="bg-slate-50">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <StoryHeading eyebrow={t("eyebrow")} title={t("title")} />
        <StoryLink href="/features#member-management">{t("exploreLink")}</StoryLink>
      </div>
      <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <article className="border-t border-slate-300 pt-7">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <Users size={18} aria-hidden="true" /> {t("managementBadge")}
          </div>
          <h3 className="mt-6 text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
            {t("managementTitle")}
          </h3>
          <p className="mt-5 max-w-lg text-base leading-8 text-slate-500">
            {t("managementDesc")}
          </p>
          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-3 border-t border-slate-200 pt-5 text-xs text-slate-600">
            {[t("tagDetails"), t("tagHistory"), t("tagPayments"), t("tagVisits")].map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </article>
        <article className="border-t border-slate-300 pt-7">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <WalletCards size={18} aria-hidden="true" /> {t("membershipsBadge")}
          </div>
          <h3 className="mt-6 text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
            {t("membershipsTitle")}
          </h3>
          <p className="mt-5 text-base leading-8 text-slate-500">
            {t("membershipsDesc")}
          </p>
          <div className="mt-5">
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
          <p className="text-base leading-8 text-slate-300">
            {t("description")}
          </p>
          <div className="mt-5">
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
      <ul className="mt-8 grid gap-5 border-t border-white/15 pt-7 sm:grid-cols-2 lg:grid-cols-4">
        {[t("tag1"), t("tag2"), t("tag3"), t("tag4")].map((text) => (
          <li key={text} className="flex items-center gap-3 text-sm text-slate-200">
            <Receipt size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-slate-400" />
            {text}
          </li>
        ))}
      </ul>
    </StorySection>
  );
}

export function AttendanceStory() {
  const t = useTranslations("marketing.attendanceStory");

  return (
    <StorySection id="attendance">
      <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div>
          <StoryHeading eyebrow={t("eyebrow")} title={t("title")}>
            {t("description")}
          </StoryHeading>
          <ol className="mt-7 divide-y divide-slate-200">
            {[t("step1"), t("step2"), t("step3")].map((text, index) => (
              <li key={text} className="flex items-center gap-4 py-4 text-sm text-slate-600">
                <span className="text-xs text-slate-400">0{index + 1}</span>
                {text}
              </li>
            ))}
          </ol>
        </div>
        <div className="min-w-0 rounded-2xl bg-slate-50 px-4 py-8 sm:p-8 lg:py-16">
          <ProductCrop
            label={t("checkInLabel")}
            src="/home-check-in.webp"
            width={1535}
            height={185}
            alt="Fitivo member check-in search with a field for member name or phone number."
            caption={t("checkInCaption")}
          />
          <div className="mt-7 flex items-center gap-3 text-sm text-slate-500">
            <CalendarCheck size={18} aria-hidden="true" />
            {t("connectedFooter")}
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
    <StorySection id="reports" className="bg-slate-50">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
        <div>
          <StoryHeading eyebrow={t("eyebrow")} title={t("title")}>
            {t("description")}
          </StoryHeading>
          <div className="mt-5">
            <StoryLink href="/features#reports">{t("exploreLink")}</StoryLink>
          </div>
        </div>
        <dl className="divide-y divide-slate-200">
          {items.map(([title, text], index) => (
            <div key={title} className="py-6 first:pt-0">
              <dt className="flex gap-4 text-lg font-medium text-slate-900">
                <span className="pt-1 text-xs text-slate-400">0{index + 1}</span>
                {title}
              </dt>
              <dd className="mt-3 pl-8 rtl:pl-0 rtl:pr-8 text-sm leading-7 text-slate-500">
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
