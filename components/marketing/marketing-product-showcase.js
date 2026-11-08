"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BarChart3, CalendarCheck, Check, CreditCard, LayoutDashboard } from "lucide-react";
import { PRODUCT_VIEWS } from "../../config/site.js";
import MarketingContainer from "./marketing-container.js";

const iconMap = {
  administration: LayoutDashboard,
  fees: CreditCard,
  attendance: CalendarCheck,
  reports: BarChart3,
};

export default function MarketingProductShowcase({ showDetailsLink = true }) {
  const [selected, setSelected] = useState(0);
  const refs = useRef([]);
  const id = useId();

  function selectWithKeyboard(event, index) {
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % PRODUCT_VIEWS.length
        : event.key === "ArrowLeft"
        ? (index - 1 + PRODUCT_VIEWS.length) % PRODUCT_VIEWS.length
        : event.key === "Home"
        ? 0
        : event.key === "End"
        ? PRODUCT_VIEWS.length - 1
        : null;

    if (next === null) return;
    event.preventDefault();
    setSelected(next);
    refs.current[next]?.focus();
  }

  const currentView = PRODUCT_VIEWS[selected];

  return (
    <section
      aria-label="Fitivo Interactive Product Showcase"
      className="scroll-mt-24 border-y border-slate-200/80 bg-slate-50/50 py-16 sm:py-20 lg:py-24"
    >
      <MarketingContainer>
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600">
            Inside Fitivo
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Four connected parts of your gym day.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            From front-desk check-ins to financial visibility and membership renewals, explore how Fitivo keeps every operation synchronized.
          </p>
        </div>

        {/* Tab navigation pills */}
        <div className="mt-10 flex justify-center">
          <div
            role="tablist"
            aria-label="Explore Fitivo workspaces"
            className="inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-xs"
          >
            {PRODUCT_VIEWS.map((view, index) => {
              const Icon = iconMap[view.id] || LayoutDashboard;
              const isSelected = selected === index;
              return (
                <button
                  key={view.id}
                  ref={(el) => {
                    refs.current[index] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${id}-tab-${view.id}`}
                  aria-controls={`${id}-panel-${view.id}`}
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setSelected(index)}
                  onKeyDown={(event) => selectWithKeyboard(event, index)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{view.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active tab content preview */}
        <div className="mt-8">
          {PRODUCT_VIEWS.map((view, index) => {
            const isSelected = selected === index;
            return (
              <div
                key={view.id}
                role="tabpanel"
                id={`${id}-panel-${view.id}`}
                aria-labelledby={`${id}-tab-${view.id}`}
                hidden={!isSelected}
                tabIndex={0}
                className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
              >
                {isSelected && (
                  <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/5">
                    {/* Header info strip */}
                    <div className="grid gap-4 border-b border-slate-100 bg-slate-50/70 p-6 sm:grid-cols-[1.2fr_0.8fr] sm:items-center sm:p-8">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                          Workspace Module
                        </span>
                        <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                          {view.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                          {view.description}
                        </p>
                      </div>

                      {/* Capabilities pill tags */}
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        {view.areas?.map((area) => (
                          <span
                            key={area}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs"
                          >
                            <Check size={13} className="text-emerald-600" aria-hidden="true" />
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Screenshot view */}
                    <div className="relative overflow-hidden bg-slate-950/5 p-2 sm:p-4">
                      {view.screenshot && (
                        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-inner">
                          <Image
                            src={view.screenshot.src}
                            alt={`${view.label} dashboard screenshot preview`}
                            width={view.screenshot.width}
                            height={view.screenshot.height}
                            sizes="(max-width: 1024px) 100vw, 1100px"
                            className="h-auto w-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom footer link */}
        {showDetailsLink && (
          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white px-6 py-4 shadow-xs sm:flex-row">
            <p className="text-sm font-medium text-slate-600">
              One unified gym platform. Zero disconnected paper spreadsheets.
            </p>
            <Link
              href="/demo"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              <span>Explore live interactive tour</span>
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
        )}
      </MarketingContainer>
    </section>
  );
}
