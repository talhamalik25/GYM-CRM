"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

export default function MarketingAnnouncement() {
  const t = useTranslations("marketing.announcement");
  return (
    <aside aria-label="Fitivo trial announcement" className="bg-[#18191d] font-sans text-white">
      <div className="mx-auto flex h-8 items-center justify-center gap-5 px-4 text-[10px] leading-none">
        <span className="hidden sm:inline">{t("tagline")}</span>
        <Link
          href="/register"
          className="inline-flex h-8 items-center gap-2 whitespace-nowrap font-semibold text-white! transition-colors hover:text-indigo-200! focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
        >
          {t("startTrial")} <ArrowRight size={12} aria-hidden="true" className="rtl:rotate-180" />
        </Link>
        <span className="hidden text-white/70 md:inline">{t("subtext")}</span>
      </div>
    </aside>
  );
}
