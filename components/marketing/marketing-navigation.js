"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarCheck2,
  ChartNoAxesColumn,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Dumbbell,
  Globe2,
  MapPinned,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";
import MarketingContainer from "./marketing-container.js";
import FitivoLogo from "../brand/fitivo-logo.js";
import MarketingShellAction from "./marketing-shell-action.js";

function CountryFlag({ countryCode, className = "", size = 18, fallback = "🌐" }) {
  const normalizedCode = typeof countryCode === "string" ? countryCode.trim().toUpperCase() : "";
  const isValid = /^[A-Z]{2}$/.test(normalizedCode);
  const flag = isValid ? String.fromCodePoint(...normalizedCode.split("").map((char) => 127397 + char.charCodeAt(0))) : fallback;

  return (
    <span
      aria-label={isValid ? `${normalizedCode} flag` : "Country flag"}
      className={className}
      style={{ fontSize: `${size}px`, lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
    >
      {flag}
    </span>
  );
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

const productItems = [
  { title: "Members", href: "/features#member-management", Icon: Users, description: "Member records and membership context." },
  { title: "Memberships", href: "/features#memberships", Icon: Dumbbell, description: "Plans, terms and renewals." },
  { title: "Payments", href: "/features#fees", Icon: CreditCard, description: "Recorded payments, dues and receipts." },
  { title: "Attendance", href: "/features#attendance", Icon: CalendarCheck2, description: "Member-linked gym visits." },
  { title: "Reports", href: "/features#reports", Icon: ChartNoAxesColumn, description: "Review operational records and collections." },
  { title: "Staff & Trainers", href: "/features#trainers", Icon: UserRound, description: "Give your team the right workspace access." },
];

const solutionItems = [
  { title: "Gym owners", description: "Operational visibility across members, payments and attendance.", Icon: Building2 },
  { title: "Front desk & staff", description: "Handle everyday member and payment workflows.", Icon: BriefcaseBusiness },
  { title: "Trainers", description: "Access assigned members and relevant activity.", Icon: ShieldCheck },
  { title: "Multi-location", description: "Manage eligible locations on supported plans.", Icon: MapPinned },
];

const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600";
const navLink = "flex min-h-11 items-center rounded-full px-3.5 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-indigo-700 aria-[current=page]:bg-indigo-50 aria-[current=page]:text-indigo-700 motion-reduce:transition-none " + focus;

export default function MarketingNavigation() {
  const pathname = usePathname();
  const headerRef = useRef(null);
  const regionRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
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
    if (!mobileOpen && !productOpen && !solutionsOpen && !regionOpen) return;

    function onEscape(event) {
      if (event.key !== "Escape") return;
      setRegionOpen(false);
      setProductOpen(false);
      setSolutionsOpen(false);
      setMobileOpen(false);
    }

    function onPointerDown(event) {
      const clickedInsideHeader = headerRef.current?.contains(event.target);
      const clickedInsideRegion = regionRef.current?.contains(event.target);
      if (!clickedInsideHeader && !clickedInsideRegion) {
        setRegionOpen(false);
        setProductOpen(false);
        setSolutionsOpen(false);
      }
    }

    document.addEventListener("keydown", onEscape);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("keydown", onEscape);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [mobileOpen, productOpen, regionOpen, solutionsOpen]);

  function closeMenus() {
    setProductOpen(false);
    setSolutionsOpen(false);
    setMobileOpen(false);
    setRegionOpen(false);
  }

  function productLinks(mobile = false) {
    return productItems.map(({ title, href, Icon, description }) => (
      <Link
        key={href}
        href={href}
        onClick={closeMenus}
        className={"group flex min-h-11 items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/60 hover:shadow-[0_18px_36px_-24px_rgba(79,70,229,0.45)] " + focus}
      >
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition-colors duration-200 group-hover:bg-indigo-600 group-hover:text-white">
          <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-slate-900 group-hover:text-indigo-700">{title}</span>
          {!mobile && <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>}
        </span>
      </Link>
    ));
  }

  function solutionLinks(mobile = false) {
    return solutionItems.map(({ title, description, Icon }) => (
      <button
        key={title}
        type="button"
        className={"group flex w-full items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/60 hover:shadow-[0_18px_36px_-24px_rgba(79,70,229,0.45)] " + focus}
      >
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 transition-colors duration-200 group-hover:bg-indigo-600 group-hover:text-white">
          <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-slate-900 group-hover:text-indigo-700">{title}</span>
          {!mobile && <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>}
        </span>
      </button>
    ));
  }

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-[70] border-b border-slate-200/80 bg-white/90 font-sans text-slate-900 backdrop-blur-xl shadow-[0_18px_35px_-28px_rgba(15,23,42,0.18)]"
    >
      <div className="border-b border-slate-900 bg-[#0B1120] text-slate-200">
        <MarketingContainer className="flex h-[36px] items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
          <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
            <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-indigo-400/80 bg-indigo-500/10 text-indigo-200">
              <Sparkles size={10} aria-hidden="true" />
            </span>
            <span className="truncate text-slate-200">Explore Fitivo with a 7-day trial</span>
            <span className="hidden h-3.5 w-px bg-slate-600 sm:block" aria-hidden="true" />
            <span className="hidden items-center gap-1.5 whitespace-nowrap text-slate-400 sm:flex">
              <span>Members</span>
              <span className="text-slate-600">•</span>
              <span>Payments</span>
              <span className="text-slate-600">•</span>
              <span>Attendance</span>
              <span className="text-slate-600">•</span>
              <span>Operations</span>
            </span>
          </div>
          <Link href="/free-trial" className="inline-flex items-center gap-1.5 font-semibold text-slate-100 transition-all duration-200 hover:text-indigo-300 motion-reduce:transition-none">
            Start your trial
            <ArrowRight size={12} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </MarketingContainer>
      </div>

      <MarketingContainer className="flex h-[74px] items-center justify-between gap-5 xl:h-[82px]">
        <Link href="/" aria-label="Fitivo home" onClick={closeMenus} className={"inline-flex min-h-11 items-center " + focus}>
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-xl bg-indigo-50 text-indigo-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <div className="h-3.5 w-3.5 rounded-md bg-gradient-to-br from-indigo-500 to-indigo-700" aria-hidden="true" />
            </div>
            <div className="flex flex-col leading-none">
              <FitivoLogo width={146} height={48} />
            </div>
          </div>
        </Link>

        <nav aria-label="Main navigation" className="hidden flex-1 items-center justify-center gap-1 xl:flex">
          <div className="relative">
            <button
              type="button"
              className={navLink + " gap-1.5"}
              aria-expanded={productOpen}
              aria-controls="fitivo-product-menu"
              onClick={() => { setProductOpen((current) => !current); setSolutionsOpen(false); }}
            >
              Product
              <ChevronDown size={14} aria-hidden="true" className={productOpen ? "rotate-180" : ""} />
            </button>
            <div id="fitivo-product-menu" hidden={!productOpen} className="absolute left-1/2 top-[calc(100%+18px)] w-[620px] -translate-x-1/2 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_60px_-35px_rgba(15,23,42,0.38)] ring-1 ring-slate-100 transition-all duration-200 ease-out data-[state=open]:opacity-100 data-[state=closed]:opacity-0"
              style={{ opacity: productOpen ? 1 : 0, transform: productOpen ? "translateY(0)" : "translateY(6px)" }}
            >
              <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Your gym, connected</div>
              <div className="grid grid-cols-2 gap-2 p-3">{productLinks()}</div>
              <Link href="/features" onClick={closeMenus} className={"flex min-h-12 items-center justify-between border-t border-slate-200 bg-gradient-to-r from-indigo-50 to-white px-5 text-sm font-semibold text-indigo-700 transition-colors hover:text-indigo-800 " + focus}>
                Explore all features
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              className={navLink + " gap-1.5"}
              aria-expanded={solutionsOpen}
              aria-controls="fitivo-solutions-menu"
              onClick={() => { setSolutionsOpen((current) => !current); setProductOpen(false); }}
            >
              Solutions
              <ChevronDown size={14} aria-hidden="true" className={solutionsOpen ? "rotate-180" : ""} />
            </button>
            <div id="fitivo-solutions-menu" hidden={!solutionsOpen} className="absolute left-1/2 top-[calc(100%+18px)] w-[360px] -translate-x-1/2 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_28px_60px_-35px_rgba(15,23,42,0.38)] ring-1 ring-slate-100 transition-all duration-200 ease-out"
              style={{ opacity: solutionsOpen ? 1 : 0, transform: solutionsOpen ? "translateY(0)" : "translateY(6px)" }}
            >
              <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">For every team</div>
              <div className="space-y-2 p-2">{solutionLinks()}</div>
            </div>
          </div>

          <Link href="/pricing" className={navLink} aria-current={pathname === "/pricing" ? "page" : undefined} onClick={closeMenus}>Pricing</Link>
          <Link href="/demo" className={navLink} aria-current={pathname === "/demo" ? "page" : undefined} onClick={closeMenus}>Product Tour</Link>
        </nav>

        <div className="hidden items-center justify-end gap-2 xl:flex">
          <div className="relative" ref={regionRef}>
            <button
              type="button"
              className={"inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 " + focus}
              aria-expanded={regionOpen}
              aria-controls="fitivo-region-menu"
              onClick={() => setRegionOpen((current) => !current)}
            >
              <span className="grid size-7 place-items-center rounded-full border border-slate-200 bg-slate-50 text-sm">
                <Globe2 size={14} aria-hidden="true" />
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CountryFlag countryCode={selectedRegion.code} size={18} className="inline-flex" />
                <span className="hidden sm:inline">{selectedRegion.code}</span>
              </span>
              <ChevronDown size={14} aria-hidden="true" className={regionOpen ? "rotate-180" : ""} />
            </button>

            <div id="fitivo-region-menu" hidden={!regionOpen} className="absolute right-0 top-[calc(100%+16px)] w-[440px] overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_60px_-35px_rgba(15,23,42,0.38)] ring-1 ring-slate-100">
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

          <Link href="/contact" className={"inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-indigo-700 " + focus}>
            <CircleHelp size={15} aria-hidden="true" />
            Support
          </Link>
          <Link href="/login" className={"inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-3.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-indigo-700 " + focus}>Log in</Link>
          <MarketingShellAction href="/free-trial" className="shadow-[0_18px_38px_-20px_rgba(79,70,229,0.75)]">Start 7-day trial<ArrowRight size={16} aria-hidden="true" /></MarketingShellAction>
        </div>

        <button
          ref={mobileMenuRef}
          type="button"
          className={"grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-indigo-700 xl:hidden " + focus}
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
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50/80 px-3 py-2.5">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700">
              <Sparkles size={12} aria-hidden="true" />
              7-day fitivo trial
            </span>
            <Link href="/free-trial" onClick={closeMenus} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-indigo-700">Start <ArrowRight size={12} aria-hidden="true" /></Link>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-2">
              <button type="button" className={"flex min-h-12 w-full items-center justify-between rounded-full px-3 text-sm font-semibold text-slate-700 " + focus} aria-expanded={productOpen} aria-controls="fitivo-mobile-product" onClick={() => setProductOpen((current) => !current)}>
                Product
                <ChevronDown size={16} aria-hidden="true" className={productOpen ? "rotate-180" : ""} />
              </button>
              <div id="fitivo-mobile-product" hidden={!productOpen} className="mt-2 border-l border-slate-200 pl-2">{productLinks(true)}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-2">
              <button type="button" className={"flex min-h-12 w-full items-center justify-between rounded-full px-3 text-sm font-semibold text-slate-700 " + focus} aria-expanded={solutionsOpen} aria-controls="fitivo-mobile-solutions" onClick={() => setSolutionsOpen((current) => !current)}>
                Solutions
                <ChevronDown size={16} aria-hidden="true" className={solutionsOpen ? "rotate-180" : ""} />
              </button>
              <div id="fitivo-mobile-solutions" hidden={!solutionsOpen} className="mt-2 border-l border-slate-200 pl-2">{solutionLinks(true)}</div>
            </div>

            <Link href="/pricing" className={navLink + " w-full justify-between"} aria-current={pathname === "/pricing" ? "page" : undefined} onClick={closeMenus}>
              Pricing
              <ChevronRight size={14} aria-hidden="true" />
            </Link>
            <Link href="/demo" className={navLink + " w-full justify-between"} aria-current={pathname === "/demo" ? "page" : undefined} onClick={closeMenus}>
              Product Tour
              <ChevronRight size={14} aria-hidden="true" />
            </Link>

            <button type="button" onClick={() => setRegionOpen((current) => !current)} className={"flex w-full items-center justify-between rounded-full border border-slate-200 bg-white px-3 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 " + focus}>
              <span className="inline-flex items-center gap-3">
                <CountryFlag countryCode={selectedRegion.code} size={20} className="inline-flex" />
                <span>{selectedRegion.countryName}</span>
              </span>
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">{selectedRegion.code}<ChevronDown size={14} aria-hidden="true" /></span>
            </button>

            {regionOpen && (
              <div className="rounded-[22px] border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-200 p-3">
                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    <Search size={14} aria-hidden="true" />
                    <input value={regionQuery} onChange={(event) => setRegionQuery(event.target.value)} className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none" placeholder="Search country or code" aria-label="Search country or code" />
                  </label>
                </div>
                <div className="max-h-[280px] overflow-y-auto p-2">
                  {filteredRegions.map((region) => (
                    <button key={region.code} type="button" onClick={() => { setSelectedRegion(region); setRegionOpen(false); setRegionQuery(""); }} className={"flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition-colors hover:bg-indigo-50 " + (selectedRegion.code === region.code ? "bg-indigo-50 text-indigo-700" : "text-slate-700")}>
                      <span className="flex items-center gap-3">
                        <CountryFlag countryCode={region.code} size={20} className="inline-flex" />
                        <span>{region.countryName}</span>
                      </span>
                      <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-slate-500">
                        {selectedRegion.code === region.code && <Check size={12} aria-hidden="true" className="text-indigo-600" />}
                        {region.code}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4">
              <Link href="/contact" className={navLink + " w-full justify-between"} onClick={closeMenus}>
                Support
                <ChevronRight size={14} aria-hidden="true" />
              </Link>
              <Link href="/login" className={navLink + " w-full justify-between"} onClick={closeMenus}>
                Log in
                <ChevronRight size={14} aria-hidden="true" />
              </Link>
              <MarketingShellAction href="/free-trial" onClick={closeMenus}>Start 7-day trial<ArrowRight size={16} aria-hidden="true" /></MarketingShellAction>
            </div>
          </div>
        </MarketingContainer>
      </nav>
    </header>
  );
}
