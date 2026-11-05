"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Check, ChevronDown, Globe2, Menu, Search, X } from "lucide-react";
import Image from "next/image";
import MarketingContainer from "./marketing-container.js";
import FitivoLogo from "../brand/fitivo-logo.js";
import MarketingShellAction from "./marketing-shell-action.js";

function CountryFlag({ countryCode, className = "", size = 18, fallback = "🌐" }) {
  const normalizedCode = typeof countryCode === "string" ? countryCode.trim().toUpperCase() : "";
  const isValid = /^[A-Z]{2}$/.test(normalizedCode);
  return isValid ? (
    <Image src={`/flags/${normalizedCode.toLowerCase()}.svg`} alt={`${normalizedCode} flag`} width={size + 6} height={size} className={`shrink-0 rounded-sm object-contain ${className}`} unoptimized />
  ) : <span aria-label="Country flag" className={className}>{fallback}</span>;
}

const regionOptions = [
  { code: "PK", countryName: "Pakistan", locale: "en-PK", language: "English", currency: "PKR", direction: "ltr" },
  { code: "US", countryName: "United States", locale: "en-US", language: "English", currency: "USD", direction: "ltr" },
  { code: "AE", countryName: "United Arab Emirates", locale: "en-AE", language: "English", currency: "AED", direction: "ltr" },
  { code: "SA", countryName: "Saudi Arabia", locale: "ar-SA", language: "Arabic", currency: "SAR", direction: "rtl" },
  { code: "GB", countryName: "United Kingdom", locale: "en-GB", language: "English", currency: "GBP", direction: "ltr" },
  { code: "DE", countryName: "Germany", locale: "de-DE", language: "German", currency: "EUR", direction: "ltr" },
  { code: "FR", countryName: "France", locale: "fr-FR", language: "French", currency: "EUR", direction: "ltr" },
  { code: "IN", countryName: "India", locale: "en-IN", language: "English", currency: "INR", direction: "ltr" },
  { code: "BD", countryName: "Bangladesh", locale: "en-BD", language: "English", currency: "BDT", direction: "ltr" },
  { code: "MY", countryName: "Malaysia", locale: "en-MY", language: "English", currency: "MYR", direction: "ltr" },
  { code: "AU", countryName: "Australia", locale: "en-AU", language: "English", currency: "AUD", direction: "ltr" },
  { code: "CA", countryName: "Canada", locale: "en-CA", language: "English", currency: "CAD", direction: "ltr" },
];
const storageKey = "fitivo-region-preference";
const defaultRegion = regionOptions[0];

const navigationLinks = [
  ["Features", "/features"], ["Pricing", "/pricing"], ["Product Tour", "/demo"],
  ["Guide", "/guide"], ["About", "/about"], ["Contact", "/contact"],
];

const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600";
const navLink = "inline-flex min-h-11 items-center whitespace-nowrap text-[13px] font-medium text-slate-600! transition-colors hover:text-slate-950! aria-[current=page]:text-indigo-700 motion-reduce:transition-none " + focus;

export default function MarketingNavigation() {
  const pathname = usePathname();
  const headerRef = useRef(null);
  const regionRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [regionQuery, setRegionQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState(() => {
    if (typeof window === "undefined") return defaultRegion;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return defaultRegion;
      const parsed = JSON.parse(raw);
      return regionOptions.find((region) => region.code === parsed.code) || defaultRegion;
    } catch {
      return defaultRegion;
    }
  });

  const filteredRegions = useMemo(() => {
    const query = regionQuery.trim().toLowerCase();
    if (!query) return regionOptions;
    return regionOptions.filter((region) => {
      const matchBases = [region.countryName, region.code, region.currency, region.language, region.locale];
      return matchBases.some((value) => value.toLowerCase().includes(query));
    });
  }, [regionQuery]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({
          code: selectedRegion.code,
          countryName: selectedRegion.countryName,
          locale: selectedRegion.locale,
          language: selectedRegion.language,
          currency: selectedRegion.currency,
          direction: selectedRegion.direction,
        }));
      } catch {
        // Ignore storage failures for public marketing preferences.
      }
    }

    if (typeof document !== "undefined") {
      document.documentElement.lang = selectedRegion.locale;
    }
  }, [selectedRegion]);

  useEffect(() => {
    if (!mobileOpen && !regionOpen) return;

    function onEscape(event) {
      if (event.key !== "Escape") return;
      setRegionOpen(false);
      setMobileOpen(false);
    }

    function onPointerDown(event) {
      const clickedInsideHeader = headerRef.current?.contains(event.target);
      const clickedInsideRegion = regionRef.current?.contains(event.target);
      if (!clickedInsideHeader && !clickedInsideRegion) {
        setRegionOpen(false);
      }
    }

    document.addEventListener("keydown", onEscape);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("keydown", onEscape);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [mobileOpen, regionOpen]);

  function closeMenus() {
    setMobileOpen(false);
    setRegionOpen(false);
  }

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-[70] border-b border-slate-100 bg-white font-sans text-slate-900"
    >
      <MarketingContainer className="flex h-[75px] max-w-[1280px] items-center justify-between gap-3 xl:gap-0">
        <Link href="/" aria-label="Fitivo home" onClick={closeMenus} className={"inline-flex min-h-11 w-40 shrink-0 items-center overflow-hidden " + focus}>
          <FitivoLogo width={200} height={66} className="-ml-5 [&_img]:max-w-none" />
        </Link>
        <nav aria-label="Main navigation" className="ml-auto mr-20 hidden items-center gap-6 xl:flex">
          {navigationLinks.map(([label, href]) => <Link key={href} href={href} className={navLink} aria-current={pathname === href ? "page" : undefined} onClick={closeMenus}>{label}</Link>)}
        </nav>
        <div className="ml-auto flex items-center justify-end gap-5 xl:ml-0">
          <div className="relative z-10" ref={regionRef}>
            <button
              type="button"
              className={"inline-flex min-h-11 items-center gap-2 bg-white text-[13px] font-medium text-slate-700 transition-colors hover:text-slate-950 motion-reduce:transition-none " + focus}
              aria-label={`Choose region: ${selectedRegion.countryName}`}
              aria-expanded={regionOpen}
              aria-controls="fitivo-region-menu"
              onClick={() => setRegionOpen((current) => !current)}
            >
              <span className="hidden place-items-center sm:grid">
                <Globe2 size={16} aria-hidden="true" />
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CountryFlag countryCode={selectedRegion.code} size={18} className="inline-flex" />
                <span className="inline">{selectedRegion.code}</span>
              </span>
              <ChevronDown size={14} aria-hidden="true" className={regionOpen ? "rotate-180" : ""} />
            </button>

            <div id="fitivo-region-menu" hidden={!regionOpen} className="fixed inset-x-5 top-[108px] xl:absolute xl:inset-x-auto xl:right-0 xl:top-[calc(100%+16px)] xl:w-[440px] overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_60px_-35px_rgba(15,23,42,0.38)] ring-1 ring-slate-100">
              <div className="border-b border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Choose your region</p>
                    <p className="mt-1 text-xs text-slate-500">Select your country to personalize currency and locale.</p>
                  </div>
                </div>
                <label className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
                  <Search size={14} aria-hidden="true" />
                  <input
                    value={regionQuery}
                    onChange={(event) => setRegionQuery(event.target.value)}
                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    placeholder="Search country or code"
                    aria-label="Search country or code"
                  />
                </label>
              </div>

              <div className="max-h-[360px] overflow-y-auto p-2">
                {filteredRegions.length > 0 ? filteredRegions.map((region) => (
                  <button
                    key={region.code}
                    type="button"
                    onClick={() => { setSelectedRegion(region); setRegionOpen(false); setRegionQuery(""); }}
                    className={"flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-200 hover:bg-indigo-50 " + (selectedRegion.code === region.code ? "bg-indigo-50 text-indigo-700" : "text-slate-700")}
                  >
                    <span className="flex items-center gap-3">
                      <CountryFlag countryCode={region.code} size={24} className="inline-flex" />
                      <span>
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          <span>{region.countryName}</span>
                          {selectedRegion.code === region.code && <Check size={14} aria-hidden="true" className="text-indigo-600" />}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-slate-500">{region.language} · {region.currency}</span>
                      </span>
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{region.code}</span>
                  </button>
                )) : <p className="px-3 py-6 text-sm text-slate-500">No matching countries found.</p>}
              </div>
            </div>
          </div>

          <Link href="/login" className={"hidden min-h-11 w-16 items-center whitespace-nowrap text-[13px] font-medium text-slate-600! transition-colors hover:text-slate-950! motion-reduce:transition-none xl:inline-flex " + focus}>Log in</Link>
          <div className="hidden xl:block"><MarketingShellAction href="/register" className="h-12 w-[157px] rounded-[8px]! bg-primary! px-4! text-[13px]! shadow-sm hover:bg-primary-hover!">Start 7-Day Trial<ArrowRight size={16} aria-hidden="true" /></MarketingShellAction></div>
        </div>

        <button
          ref={mobileMenuRef}
          type="button"
          className={"grid size-11 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 hover:text-indigo-700 xl:hidden " + focus}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
          aria-controls="fitivo-mobile-navigation"
          onClick={() => setMobileOpen((current) => !current)}
        >
          {mobileOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
        </button>
      </MarketingContainer>

      <nav id="fitivo-mobile-navigation" hidden={!mobileOpen} aria-label="Mobile navigation" className="absolute inset-x-0 top-full max-h-[calc(100dvh-120px)] overflow-y-auto border-b border-slate-200 bg-white shadow-lg shadow-slate-900/5 xl:hidden">
        <MarketingContainer className="py-5">
          <div className="flex flex-col gap-1">
            {navigationLinks.map(([label, href]) => <Link key={href} href={href} className={navLink} aria-current={pathname === href ? "page" : undefined} onClick={closeMenus}>{label}</Link>)}
          </div>
          <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4">
            <Link href="/login" className={navLink} onClick={closeMenus}>Log in</Link>
            <MarketingShellAction href="/register" onClick={closeMenus}>Start 7-Day Trial<ArrowRight size={16} aria-hidden="true" /></MarketingShellAction>
          </div>
        </MarketingContainer>
      </nav>
    </header>
  );
}
