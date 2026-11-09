"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Check, ChevronDown, Globe2, LoaderCircle, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  AVAILABLE_LOCALES,
  COUNTRIES,
  getCountry,
  getCountryDefaultLocale,
  getLocale,
  resolveCountryChangeLocale,
  searchCountries,
} from "../../config/locales.js";
import { useLocalePreferences } from "./locale-provider.js";

const mobileViewportQuery = "(max-width: 767px)";

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
  if (!country?.code) return null;
  return (
    <Image
      src={`/flags/${country.code.toLowerCase()}.svg`}
      alt=""
      aria-hidden="true"
      width={24}
      height={16}
      className={`h-4 w-6 shrink-0 rounded-[2px] border border-line/60 object-cover shadow-2xs ${className}`}
      unoptimized
      priority={false}
    />
  );
}

function CountryOption({ country, index, selected, onSelect, onKeyDown }) {
  const defaultLanguage = getLocale(country.defaultLocale);
  let languageLabel = "English";
  if (defaultLanguage) {
    languageLabel =
      defaultLanguage.nativeName === defaultLanguage.languageName
        ? defaultLanguage.nativeName
        : `${defaultLanguage.nativeName} (${defaultLanguage.languageName})`;
  }

  return (
    <button
      type="button"
      data-country-option={index}
      aria-pressed={selected}
      onClick={() => onSelect(country)}
      onKeyDown={(event) => onKeyDown(event, index)}
      className={`group flex min-h-[46px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transition-none rtl:text-right ${
        selected
          ? "bg-brand-soft text-brand-soft-text font-medium"
          : "text-ink-muted hover:bg-surface-raised hover:text-ink"
      }`}
    >
      <CountryFlag country={country} />
      <span className="min-w-0 flex-1 truncate">
        <span className="text-sm font-semibold text-ink">{country.countryName}</span>
        <span className="text-ink-subtle/60 mx-1.5" aria-hidden="true">—</span>
        <span className="text-xs text-ink-muted font-normal">{languageLabel}</span>
      </span>
      {selected && (
        <Check size={16} strokeWidth={2.5} className="shrink-0 text-brand" aria-hidden="true" />
      )}
    </button>
  );
}

export default function LanguageSwitcher({ className = "", triggerClassName = "" }) {
  const tCommon = useTranslations("common");
  const {
    locale: activeLocale,
    countryCode: activeCountryCode,
    changeLocale,
    setCountry,
  } = useLocalePreferences();

  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);
  const panelRef = useRef(null);
  const listRef = useRef(null);
  const closeTimerRef = useRef(null);
  const languageSelectId = useId();
  const isMobile = useSyncExternalStore(subscribeToViewport, getMobileViewport, getServerViewport);

  const currentCountry = getCountry(activeCountryCode) || COUNTRIES[0];
  const currentLanguage = getLocale(activeLocale) || getLocale(currentCountry.defaultLocale);
  const languageCode = (currentLanguage?.locale.split("-")[0] || "en").toUpperCase();
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

    function handleDialogKeys(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeSelector();
        return;
      }

      if (!isMobile || event.key !== "Tab") return;
      const focusableItems = [...(panelRef.current?.querySelectorAll("button:not(:disabled), input:not(:disabled), select:not(:disabled)") || [])]
        .filter((element) => element.getClientRects().length > 0);
      if (!focusableItems.length) return;
      const first = focusableItems[0];
      const last = focusableItems[focusableItems.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", handleDialogKeys);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", handleDialogKeys);
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
    if (saving) return;

    setSaving(true);
    setError("");
    try {
      // 1. Save country preference
      setCountry(country.code);

      // 2. Apply the country default unless the current language is an explicit override.
      const targetLocale = resolveCountryChangeLocale({
        currentLocale: activeLocale,
        currentCountryCode: currentCountry.code,
        nextCountryCode: country.code,
      });

      // 3. Keep an explicit language override when it differs from the current country's default.
      await changeLocale(targetLocale);

      // 4. Close dropdown
      closeSelector();
    } catch (selectionError) {
      setError(selectionError.message || "Could not change country and language.");
    } finally {
      setSaving(false);
    }
  }

  async function selectLanguage(nextLocale) {
    if (saving) return;
    if (nextLocale === activeLocale) {
      closeSelector();
      return;
    }

    setSaving(true);
    setError("");
    try {
      await changeLocale(nextLocale);
      closeSelector();
    } catch (selectionError) {
      setError(selectionError.message || "Could not change language.");
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

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      {/* Main Single Selector Trigger */}
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${tCommon("chooseCountry")}: ${currentCountry.countryName}. ${tCommon("language")}: ${currentLanguage?.nativeName || "English"}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="fitivo-country-selector"
        onClick={toggleSelector}
        className={`flex min-h-11 w-[4.5rem] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-2 py-1.5 text-xs font-semibold text-ink shadow-2xs transition-colors hover:border-line-strong hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none md:w-auto md:justify-start md:gap-2 md:px-2.5 ${triggerClassName}`}
      >
        <Globe2 size={16} aria-hidden="true" className="shrink-0 text-ink-muted md:hidden" />
        <CountryFlag country={currentCountry} className="hidden md:block" />
        <span className="text-ink-muted">{languageCode}</span>
        <ChevronDown
          size={13}
          strokeWidth={2}
          aria-hidden="true"
          className={`hidden shrink-0 text-ink-subtle transition-transform duration-200 motion-reduce:transition-none md:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {isVisible && (
        <>
          {/* Mobile Backdrop */}
          <div
            data-state={closing ? "closing" : "open"}
            className="country-selector-backdrop fixed inset-0 z-[99] bg-slate-950/40 backdrop-blur-[2px] md:hidden"
            aria-hidden="true"
            onClick={closeSelector}
          />

          {/* Unified Dropdown Popover / Mobile Bottom Sheet */}
          <section
            id="fitivo-country-selector"
            ref={panelRef}
            data-state={closing ? "closing" : "open"}
            role="dialog"
            aria-modal={isMobile ? "true" : undefined}
            aria-labelledby="fitivo-country-selector-title"
            aria-hidden={closing}
            className="country-selector-panel fixed inset-x-0 bottom-0 z-[100] flex max-h-[85dvh] flex-col overflow-hidden rounded-t-3xl border-t border-line bg-surface pb-[max(1rem,env(safe-area-inset-bottom))] text-ink shadow-2xl md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-[calc(100%+0.5rem)] md:w-[min(23rem,calc(100vw-2rem))] md:max-h-[min(28rem,80vh)] md:rounded-2xl md:border md:pb-2 md:shadow-xl rtl:md:right-auto rtl:md:left-0"
          >
            {/* Header (visible on mobile bottom-sheet) */}
            <header className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3.5 md:hidden">
              <div className="flex min-w-0 items-center gap-2.5">
                <CountryFlag country={currentCountry} />
                <h2 id="fitivo-country-selector-title" className="truncate text-sm font-bold text-ink">
                  {tCommon("country")} · {tCommon("language")}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeSelector}
                className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-subtle hover:bg-surface-raised hover:text-ink transition-colors"
                aria-label="Close selector"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            {/* Modern Search Input at Top */}
            <div className="shrink-0 p-3 border-b border-line/60">
              <label className="relative block">
                <span className="sr-only">{tCommon("searchCountryOrLanguage")}</span>
                <Search
                  size={15}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle rtl:left-auto rtl:right-3"
                />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={tCommon("searchCountryOrLanguage")}
                  className="h-10 w-full rounded-xl border border-line bg-surface-raised/40 py-2 pl-9 pr-3 text-xs text-ink outline-none transition-colors placeholder:text-ink-subtle focus:border-brand focus:ring-1 focus:ring-brand rtl:pl-3 rtl:pr-9"
                />
              </label>
            </div>

            <div className="shrink-0 border-b border-line/60 px-3 py-2.5">
              <label htmlFor={languageSelectId} className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
                Language
              </label>
              <select
                id={languageSelectId}
                value={activeLocale}
                disabled={saving}
                onChange={(event) => selectLanguage(event.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand disabled:cursor-wait disabled:opacity-70"
              >
                {AVAILABLE_LOCALES.map(({ locale, nativeName, languageName }) => (
                  <option key={locale} value={locale}>{nativeName} ({languageName}) · {locale}</option>
                ))}
              </select>
            </div>

            {saving && (
              <p className="flex shrink-0 items-center gap-2 px-4 py-2 text-xs font-medium text-brand" role="status">
                <LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                Applying country and language…
              </p>
            )}
            {error && <p role="alert" className="px-4 py-2 text-xs text-danger">{error}</p>}

            {/* Unified Country List with Hidden Scrollbar */}
            <div
              ref={listRef}
              role="group"
              aria-label={tCommon("country")}
              className="country-selector-list min-h-0 flex-1 overflow-y-auto px-2 py-2 space-y-0.5 overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-h-[min(55vh,22rem)] md:max-h-[min(22rem,55vh)]"
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
                <p className="px-3 py-8 text-center text-xs text-ink-subtle">{tCommon("noCountriesFound")}</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
