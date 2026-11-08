"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Check, ChevronDown, LoaderCircle, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  COUNTRIES,
  getCountry,
  getLocale,
  searchCountries,
} from "../../config/locales.js";
import { useLocalePreferences } from "./locale-provider.js";

const mobileViewportQuery = "(max-width: 767px)";

const AVAILABLE_LANGUAGES = [
  { locale: "en-US", nativeName: "English", languageName: "English" },
  { locale: "ur-PK", nativeName: "اردو", languageName: "Urdu" },
  { locale: "ar-SA", nativeName: "العربية", languageName: "Arabic" },
  { locale: "fr-FR", nativeName: "français", languageName: "French" },
  { locale: "es-ES", nativeName: "español", languageName: "Spanish" },
  { locale: "de-DE", nativeName: "Deutsch", languageName: "German" },
  { locale: "pt-BR", nativeName: "português", languageName: "Portuguese" },
  { locale: "tr-TR", nativeName: "Türkçe", languageName: "Turkish" },
  { locale: "hi-IN", nativeName: "हिन्दी", languageName: "Hindi" },
];

function subscribeToViewport(callback) {
  const mediaQuery = window.matchMedia(mobileViewportQuery);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getMobileViewport() {
  return window.matchMedia(mobileViewportQuery).matches;
}

function getServerViewport() {
  return false;
}

function CountryFlag({ country, className = "" }) {
  return (
    <Image
      src={`/flags/${country.code.toLowerCase()}.svg`}
      alt=""
      aria-hidden="true"
      width={28}
      height={19}
      className={`h-[19px] w-7 shrink-0 rounded-[3px] border border-line/60 object-contain ${className}`}
      unoptimized
      priority={false}
    />
  );
}

function CountryOption({ country, index, selected, onSelect, onKeyDown }) {
  const defaultLanguage = getLocale(country.defaultLocale);
  const language = defaultLanguage
    ? `${defaultLanguage.nativeName} (${defaultLanguage.languageName})`
    : "English";

  return (
    <button
      type="button"
      data-country-option={index}
      aria-pressed={selected}
      onClick={() => onSelect(country)}
      onKeyDown={(event) => onKeyDown(event, index)}
      className={`flex min-h-14 w-full items-center gap-3 rounded-xl px-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transition-none ${
        selected
          ? "bg-brand-soft text-brand-soft-text"
          : "text-ink-muted hover:bg-surface-raised hover:text-ink"
      }`}
    >
      <CountryFlag country={country} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">
          {country.countryName}
        </span>
        <span className="block truncate text-xs text-ink-subtle">{language}</span>
      </span>
      {selected && <Check size={17} aria-hidden="true" className="shrink-0 text-brand" />}
    </button>
  );
}

export default function LanguageSwitcher({ className = "", triggerClassName = "" }) {
  const {
    locale: activeLocale,
    countryCode: activeCountryCode,
    changeLocale,
    setCountry,
  } = useLocalePreferences();
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);
  const closeTimerRef = useRef(null);
  const isMobile = useSyncExternalStore(subscribeToViewport, getMobileViewport, getServerViewport);

  const currentCountry = getCountry(activeCountryCode) || COUNTRIES[0];
  const currentLanguage = getLocale(activeLocale) || getLocale(currentCountry.defaultLocale);
  const filteredCountries = useMemo(() => searchCountries(query), [query]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    searchInputRef.current?.focus();
    const previousBodyOverflow = document.body.style.overflow;
    if (isMobile) document.body.style.overflow = "hidden";

    function dismissOutside(event) {
      if (!rootRef.current?.contains(event.target)) {
        closeSelector();
      }
    }

    function closeOnEscape(event) {
      if (event.key !== "Escape") return;
      closeSelector();
    }

    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMobile, open]);

  function moveOptionFocus(event, index) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const options = listRef.current?.querySelectorAll("[data-country-option]");
    if (!options?.length) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === "ArrowDown") nextIndex = (index + 1) % options.length;
    if (event.key === "ArrowUp") nextIndex = (index - 1 + options.length) % options.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = options.length - 1;
    options[nextIndex]?.focus();
  }

  async function selectCountry(country) {
    if (saving || country.code === currentCountry.code) {
      closeSelector();
      return;
    }

    setSaving(true);
    setError("");
    try {
      await setCountry(country.code);
      closeSelector();
    } catch (selectionError) {
      setError(selectionError.message || "Could not change country.");
    } finally {
      setSaving(false);
    }
  }

  function closeSelector() {
    setOpen(false);
    setQuery("");
    setClosing(true);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setClosing(false), 180);
    triggerRef.current?.focus();
  }

  function toggleSelector() {
    if (open) {
      closeSelector();
      return;
    }
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    setClosing(false);
    setOpen(true);
    setError("");
  }

  const isVisible = open || closing;
  const countryList = (
    <div
      ref={listRef}
      role="group"
      aria-label="Countries"
      className="country-selector-list max-h-[min(58vh,26rem)] overflow-y-auto overscroll-contain px-2 pb-2 md:max-h-[min(60vh,26rem)]"
    >
      {filteredCountries.length ? (
        filteredCountries.map((country, index) => (
          <CountryOption
            key={country.code}
            country={country}
            index={index}
            selected={country.code === currentCountry.code}
            onSelect={selectCountry}
            onKeyDown={moveOptionFocus}
          />
        ))
      ) : (
        <p className="px-3 py-8 text-center text-sm text-ink-subtle">{t("noCountriesFound")}</p>
      )}
    </div>
  );

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Country: ${currentCountry.countryName}. Language: ${currentLanguage?.nativeName || "English"}. Change country`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="fitivo-country-selector"
        onClick={() => {
          toggleSelector();
        }}
        className={`flex min-h-11 max-w-[min(15rem,42vw)] items-center gap-2 rounded-xl border border-line bg-surface px-2.5 text-sm font-medium text-ink shadow-xs transition-colors hover:border-line-strong hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none max-[359px]:max-w-12 max-[359px]:justify-center max-[359px]:px-2 ${triggerClassName}`}
      >
        <CountryFlag country={currentCountry} />
        <span className="min-w-0 truncate max-[359px]:hidden">
          <span className="hidden min-[400px]:inline">{currentCountry.countryName} · </span>
          <span>{currentLanguage?.nativeName || "English"}</span>
        </span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`shrink-0 text-ink-subtle transition-transform duration-200 motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          } max-[359px]:hidden`}
        />
      </button>

      {isVisible && (
        <>
          <div
            data-state={closing ? "closing" : "open"}
            className="country-selector-backdrop fixed inset-0 z-[99] bg-slate-950/35 md:hidden"
            aria-hidden="true"
            onClick={closeSelector}
          />

          <section
            id="fitivo-country-selector"
            data-state={closing ? "closing" : "open"}
            role="dialog"
            aria-modal={isMobile ? "true" : undefined}
            aria-labelledby="fitivo-country-selector-title"
            aria-hidden={closing}
            className="country-selector-panel fixed inset-x-0 bottom-0 z-[100] flex max-h-[min(88dvh,48rem)] flex-col overflow-hidden rounded-t-2xl border border-line bg-surface pb-[max(0.75rem,env(safe-area-inset-bottom))] text-ink shadow-2xl md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-[calc(100%+0.625rem)] md:w-[min(23.5rem,calc(100vw-2rem))] md:max-h-[min(80vh,40rem)] md:rounded-2xl md:pb-2 md:shadow-xl rtl:md:right-auto rtl:md:left-0"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3 md:px-4 md:py-3">
              <div className="flex min-w-0 items-center gap-3">
                <CountryFlag country={currentCountry} />
                <div className="min-w-0">
                  <h2 id="fitivo-country-selector-title" className="truncate text-sm font-semibold text-ink">
                    {t("chooseCountry")}
                  </h2>
                  <p className="truncate text-xs text-ink-subtle">
                    {t("countrySelectorDescription")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeSelector}
                className="grid size-11 shrink-0 place-items-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
                aria-label="Close country selector"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            {/* Language Quick Selection */}
            <div className="shrink-0 px-4 py-2.5 border-b border-line bg-surface-raised/40">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle mb-1.5">
                Languages
              </p>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Available languages">
                {AVAILABLE_LANGUAGES.map((lang) => {
                  const isSelected = activeLocale === lang.locale || (lang.locale === "en-US" && activeLocale?.startsWith("en"));
                  return (
                    <button
                      key={lang.locale}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={async () => {
                        try {
                          await changeLocale(lang.locale);
                          closeSelector();
                        } catch (err) {
                          setError(err.message || "Could not change language.");
                        }
                      }}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                        isSelected
                          ? "bg-brand text-white shadow-xs font-semibold"
                          : "bg-surface border border-line text-ink hover:border-line-strong hover:bg-surface-raised"
                      }`}
                    >
                      <span>{lang.nativeName}</span>
                      {isSelected && <Check size={12} strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="shrink-0 px-3 py-2.5">
              <label className="relative block">
                <span className="sr-only">{t("searchCountryOrLanguage")}</span>
                <Search
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle rtl:left-auto rtl:right-3"
                />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("searchCountryOrLanguage")}
                  className="min-h-11 w-full rounded-xl border border-line bg-surface py-2 pl-10 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand focus:ring-1 focus:ring-brand rtl:pl-3 rtl:pr-10"
                />
              </label>
            </div>

            {saving && (
              <p className="flex shrink-0 items-center gap-2 px-5 pb-2 text-xs font-medium text-brand" role="status">
                <LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                Updating country…
              </p>
            )}
            {error && <p role="alert" className="px-5 pb-2 text-xs text-danger">{error}</p>}
            {countryList}
          </section>
        </>
      )}
    </div>
  );
}
