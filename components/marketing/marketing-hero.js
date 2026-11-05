import Image from "next/image";
import { ArrowRight, ArrowUpRight, CalendarCheck, Check, CreditCard, Users } from "lucide-react";
import MarketingContainer from "./marketing-container.js";
import MarketingShellAction from "./marketing-shell-action.js";

export default function MarketingHero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden border-b border-slate-200 bg-slate-50/50 pb-10 pt-10 sm:pb-14 sm:pt-14 lg:pt-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-60 -z-10 mx-auto h-96 max-w-4xl rounded-full bg-indigo-100/30 blur-3xl" />
      <MarketingContainer>
        <div className="mx-auto max-w-4xl text-center">
          <p className="flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-700 sm:text-xs">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-indigo-600" />
            Fitivo · Gym management software
          </p>
          <h1 id="hero-title" className="mt-5 text-[42px] font-bold leading-[1.08] tracking-[-0.045em] text-slate-900 sm:text-[56px] lg:text-[72px]">
            Your entire gym.<br />One <span className="text-indigo-600">connected system.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-[700px] text-[17px] leading-relaxed text-slate-600 sm:text-lg">
            Manage members, memberships, payments, attendance and your team from one clear workspace built for everyday gym operations.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <MarketingShellAction href="/register" className="min-h-12 px-6 transition-[transform,box-shadow,background-color] duration-150 hover:shadow-md hover:shadow-indigo-600/20 motion-safe:hover:-translate-y-px motion-safe:hover:[&_svg]:translate-x-[3px]">
              Start 7-day trial <ArrowRight size={16} aria-hidden="true" />
            </MarketingShellAction>
            <MarketingShellAction href="/demo" variant="secondary" className="min-h-12 px-6 hover:border-slate-400 [&_svg]:transition-transform motion-reduce:[&_svg]:transition-none motion-safe:hover:[&_svg]:translate-x-0.5 motion-safe:hover:[&_svg]:-translate-y-0.5">
              Explore Fitivo <ArrowUpRight size={16} aria-hidden="true" />
            </MarketingShellAction>
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <Check size={13} aria-hidden="true" /> 7-day trial <span aria-hidden="true" className="mx-1">·</span> No card required
          </p>
        </div>

        <figure id="product" tabIndex={-1} aria-label="Inside Fitivo: attendance workspace" className="mx-auto mt-10 max-w-[1100px] scroll-mt-28 sm:mt-12">
          <div className="relative rounded-[20px] border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 sm:p-2">
            <div className="flex items-center justify-between gap-3 px-3 pb-3 pt-2 sm:px-4">
              <p className="text-xs font-semibold text-slate-900">Inside Fitivo <span className="ml-2 hidden font-normal text-slate-500 sm:inline">/ Daily operations</span></p>
              <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><CalendarCheck size={13} aria-hidden="true" /> Attendance</span>
            </div>
            {/* This source crop excludes account details, old branding and capture overlays. */}
            <div className="relative h-[440px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:h-auto sm:aspect-[1565/740]">
              <Image src="/hero-attendance.webp" alt="Fitivo attendance screen with member check-in search, daily attendance totals and an empty attendance list." width={1565} height={740} preload sizes="(max-width: 639px) 931px, (max-width: 1199px) 92vw, 1080px" className="h-[440px] w-auto max-w-none sm:h-auto sm:w-full" />
            </div>
          </div>
          <figcaption className="mt-5 flex flex-col items-center gap-3 text-xs text-slate-500 sm:flex-row sm:justify-between">
            <span>Attendance workspace · Empty-state preview</span>
            <ul aria-label="Connected product areas" className="flex flex-wrap justify-center gap-4 text-slate-600 sm:gap-5">
              {[[Users, "Member records"], [CreditCard, "Payments"], [CalendarCheck, "Attendance"]].map(([Icon, label]) => (
                <li key={label} className="flex items-center gap-1.5"><Icon size={13} aria-hidden="true" />{label}</li>
              ))}
            </ul>
          </figcaption>
        </figure>
      </MarketingContainer>
    </section>
  );
}
