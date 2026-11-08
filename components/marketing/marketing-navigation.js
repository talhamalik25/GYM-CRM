"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Check, ChevronDown, Globe2, Menu, Search, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import MarketingContainer from "./marketing-container.js";
import FitivoLogo from "../brand/fitivo-logo.js";
import MarketingShellAction from "./marketing-shell-action.js";
import { COUNTRIES, getLocale } from "../../config/locales.js";
import { useLocalePreferences } from "../i18n/locale-provider.js";

function CountryFlag({ countryCode, className = "", size = 18, fallback = "🌐" }) {
  const normalizedCode = typeof countryCode === "string" ? countryCode.trim().toUpperCase() : "";
  const localFlagCodes = new Set(["PK", "US", "AE", "SA", "GB", "DE", "FR", "IN", "BD", "MY", "AU", "CA"]);
  const isValid = /^[A-Z]{2}$/.test(normalizedCode) && localFlagCodes.has(normalizedCode);
  const flagEmoji = /^[A-Z]{2}$/.test(normalizedCode)
    ? String.fromCodePoint(...[...normalizedCode].map((letter) => letter.charCodeAt(0) + 127397))
    : fallback;
  return isValid ? (
    <Image src={`/flags/${normalizedCode.toLowerCase()}.svg`} alt={`${normalizedCode} flag`} width={size + 6} height={size} style={{ width: size + 6, height: size }} className={`shrink-0 rounded-sm object-contain ${className}`} unoptimized />
  ) : <span role="img" aria-label={`${normalizedCode} flag`} className={className}>{flagEmoji}</span>;
}

const regionOptions = COUNTRIES.map((country) => ({
  ...country,
  locale: country.defaultLocale,
  language: getLocale(country.defaultLocale)?.nativeName || "English",
}));
const storageKey = "fitivo-region-preference";
const defaultRegion = regionOptions[0];
const regionChangeEvent = "fitivo-region-preference-change";

function getStoredRegion() {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaultRegion;
    const parsed = JSON.parse(raw);
    return regionOptions.find((region) => region.code === parsed.code) || defaultRegion;
  } catch {
    return defaultRegion;
  }
}

function subscribeToRegion(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener(regionChangeEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(regionChangeEvent, callback);
  };
}

const navigationLinks = [
  ["features", "/features"], ["pricing", "/pricing"], ["productTour", "/demo"],
  ["guide", "/guide"], ["about", "/about"], ["contact", "/contact"],
];

const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600";
const navLink = "inline-flex min-h-11 items-center whitespace-nowrap text-[13px] font-medium text-slate-600! transition-colors hover:text-slate-950! aria-[current=page]:text-indigo-700 motion-reduce:transition-none " + focus;

export default function MarketingNavigation() {
  const pathname = usePathname();
  const t = useTranslations("marketing.navigation");
  const { setCountry } = useLocalePreferences();
  const headerRef = useRef(null);
  const regionRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [regionQuery, setRegionQuery] = useState("");
  const selectedRegion = useSyncExternalStore(subscribeToRegion, getStoredRegion, () => defaultRegion);

  const filteredRegions = useMemo(() => {
    const query = regionQuery.trim().toLowerCase();
    if (!query) return regionOptions;
    return regionOptions.filter((region) => {
      const matchBases = [region.countryName, region.code, region.currency, region.language, region.locale];
      return matchBases.some((value) => value.toLowerCase().includes(query));
    });
  }, [regionQuery]);

  useEffect(() => {
    setCountry(selectedRegion.code);
  }, [selectedRegion, setCountry]);

  function chooseRegion(region) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ code: region.code }));
    } catch {
      // Region selection remains available for the current page if storage is blocked.
    }
    window.dispatchEvent(new Event(regionChangeEvent));
    setRegionOpen(false);
    setRegionQuery("");
  }

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
          {navigationLinks.map(([label, href]) => <Link key={href} href={href} className={navLink} aria-current={pathname === href ? "page" : undefined} onClick={closeMenus}>{t(label)}</Link>)}
        </nav>
        <div className="ml-auto flex items-center justify-end gap-5 xl:ml-0">
          <div className="relative z-10" ref={regionRef}>
            <button
              type="button"
              className={"inline-flex min-h-11 items-center gap-2 bg-white text-[13px] font-medium text-slate-700 transition-colors hover:text-slate-950 motion-reduce:transition-none " + focus}
              aria-label={t("chooseCountry", { country: selectedRegion.countryName })}
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
                    <p className="text-sm font-semibold text-slate-900">{t("chooseCountryTitle")}</p>
                    <p className="mt-1 text-xs text-slate-500">{t("regionDescription")}</p>
                  </div>
                </div>
                <label className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
                  <Search size={14} aria-hidden="true" />
                  <input
                    value={regionQuery}
                    onChange={(event) => setRegionQuery(event.target.value)}
                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    placeholder={t("countrySearch")}
                    aria-label={t("countrySearch")}
                  />
                </label>
              </div>

              <div className="max-h-[360px] overflow-y-auto p-2">
                {filteredRegions.length > 0 ? filteredRegions.map((region) => (
                  <button
                    key={region.code}
                    type="button"
                    onClick={() => chooseRegion(region)}
                    className={"flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-200 hover:bg-indigo-50 " + (selectedRegion.code === region.code ? "bg-indigo-50 text-indigo-700" : "text-slate-700")}
                  >
                    <span className="flex items-center gap-3">
                      <CountryFlag countryCode={region.code} size={24} className="inline-flex" />
                      <span>
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          <span>{region.countryName}</span>
                          {selectedRegion.code === region.code && <Check size={14} aria-hidden="true" className="text-indigo-600" />}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-slate-500">
                          {region.language} · {region.currency}
                          {getLocale(region.locale)?.translationStatus !== "complete" && ` · ${t("englishFallback", { language: region.language })}`}
                        </span>
                      </span>
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{region.code}</span>
                  </button>
                )) : <p className="px-3 py-6 text-sm text-slate-500">{t("noCountriesFound")}</p>}
              </div>
            </div>
          </div>

          <Link href="/login" className={"hidden min-h-11 w-16 items-center whitespace-nowrap text-[13px] font-medium text-slate-600! transition-colors hover:text-slate-950! motion-reduce:transition-none xl:inline-flex " + focus}>{t("logIn")}</Link>
          <div className="hidden xl:block"><MarketingShellAction href="/register" className="h-12 w-[157px] rounded-[8px]! bg-primary! px-4! text-[13px]! shadow-sm hover:bg-primary-hover!">{t("startTrial")}<ArrowRight size={16} aria-hidden="true" /></MarketingShellAction></div>
        </div>

        <button
          ref={mobileMenuRef}
          type="button"
          className={"grid size-11 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 hover:text-indigo-700 xl:hidden " + focus}
          aria-label={mobileOpen ? t("closeNavigation") : t("openNavigation")}
          aria-expanded={mobileOpen}
          aria-controls="fitivo-mobile-navigation"
          onClick={() => setMobileOpen((current) => !current)}
        >
          {mobileOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
        </button>
      </MarketingContainer>

      <nav id="fitivo-mobile-navigation" hidden={!mobileOpen} aria-label={t("mobileNavigation")} className="absolute inset-x-0 top-full max-h-[calc(100dvh-120px)] overflow-y-auto border-b border-slate-200 bg-white shadow-lg shadow-slate-900/5 xl:hidden">
        <MarketingContainer className="py-5">
          <div className="flex flex-col gap-1">
            {navigationLinks.map(([label, href]) => <Link key={href} href={href} className={navLink} aria-current={pathname === href ? "page" : undefined} onClick={closeMenus}>{t(label)}</Link>)}
          </div>
          <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4">
            <Link href="/login" className={navLink} onClick={closeMenus}>{t("logIn")}</Link>
            <MarketingShellAction href="/register" onClick={closeMenus}>{t("startTrial")}<ArrowRight size={16} aria-hidden="true" /></MarketingShellAction>
          </div>
        </MarketingContainer>
      </nav>
    </header>
  );
}
