"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Globe2, LoaderCircle, Search, X } from "lucide-react";
import {
  AVAILABLE_LOCALES,
  COUNTRIES,
  DEFAULT_LOCALE,
  getCountry,
  getLocale,
} from "../../config/locales.js";
import { useLocalePreferences } from "./locale-provider.js";

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export default function LanguageSwitcher({ className = "", triggerClassName = "" }) {
  const { locale: activeLocale, changeLocale, resetLocale, setCountry } = useLocalePreferences();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("languages"); // "languages" | "countries"
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Active country from cookie or default to PK
  const [selectedCountryCode, setSelectedCountryCode] = useState(() => {
    if (typeof document !== "undefined") {
      const stored = getCookie("fitivo-country");
      if (stored) return stored.toUpperCase();
    }
    return "PK";
  });

  // Focus search input when menu opens
  useEffect(() => {
    if (!open) return;
    searchInputRef.current?.focus();

    function dismiss(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const currentCountry = useMemo(
    () => getCountry(selectedCountryCode) || COUNTRIES[0],
    [selectedCountryCode]
  );

  const currentLocaleObj = useMemo(
    () => getLocale(activeLocale) || AVAILABLE_LOCALES[0],
    [activeLocale]
  );

  // Filtered languages
  const filteredLanguages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return AVAILABLE_LOCALES;
    return AVAILABLE_LOCALES.filter(
      ({ locale, languageName, nativeName }) =>
        locale.toLowerCase().includes(q) ||
        languageName.toLowerCase().includes(q) ||
        nativeName.toLowerCase().includes(q)
    );
  }, [query]);

  // Filtered countries
  const filteredCountries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      ({ code, countryName, currency }) =>
        code.toLowerCase().includes(q) ||
        countryName.toLowerCase().includes(q) ||
        currency.toLowerCase().includes(q)
    );
  }, [query]);

  async function handleSelectLocale(targetLocale) {
    if (saving || targetLocale === activeLocale) return;
    setSaving(true);
    setError("");
    try {
      if (targetLocale) {
        await changeLocale(targetLocale);
      } else {
        await resetLocale();
      }
      setOpen(false);
      setQuery("");
    } catch (err) {
      setError(err.message || "Could not change language.");
    } finally {
      setSaving(false);
    }
  }

  function handleSelectCountry(countryCode) {
    setSelectedCountryCode(countryCode);
    setCountry(countryCode);
    // Note: Selecting a country does NOT switch the language (Default Language Policy).
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Language: ${currentLocaleObj.nativeName}. Choose country and language`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen((v) => !v);
          setError("");
        }}
        className={`flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-2.5 text-sm font-medium text-ink-muted shadow-xs transition-colors hover:border-line-strong hover:bg-surface-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none ${triggerClassName}`}
      >
        <Globe2 size={16} aria-hidden="true" className="shrink-0 text-brand" />
        <span className="hidden sm:inline font-medium text-ink">
          {currentLocaleObj.nativeName}
        </span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`shrink-0 text-ink-subtle transition-transform duration-200 motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Country and language selector"
          className="absolute right-0 rtl:right-auto rtl:left-0 top-[calc(100%+0.5rem)] z-50 w-[min(24rem,calc(100vw-1.5rem))] rounded-2xl border border-line bg-surface p-3 text-ink shadow-xl shadow-slate-900/10"
        >
          {/* Header & Tabs */}
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("languages")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === "languages"
                    ? "bg-brand text-white shadow-xs"
                    : "text-ink-muted hover:bg-surface-raised hover:text-ink"
                }`}
              >
                Languages
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("countries")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === "countries"
                    ? "bg-brand text-white shadow-xs"
                    : "text-ink-muted hover:bg-surface-raised hover:text-ink"
                }`}
              >
                Countries ({currentCountry.code})
              </button>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid size-7 place-items-center rounded-lg text-ink-subtle hover:bg-surface-raised hover:text-ink"
              aria-label="Close"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative my-2.5">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeTab === "languages"
                  ? "Search language or code…"
                  : "Search country or code…"
              }
              className="w-full rounded-xl border border-line bg-surface py-2 pl-9 pr-3 text-xs outline-none transition-colors placeholder:text-ink-subtle focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* Tab 1: Languages */}
          {activeTab === "languages" && (
            <div>
              {/* Country context banner with suggested languages */}
              {!query && (
                <div className="mb-2.5 rounded-xl border border-line/60 bg-surface-raised/60 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-ink-subtle uppercase tracking-wider">
                      Suggested for {currentCountry.countryName}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("countries")}
                      className="text-[11px] font-medium text-brand hover:underline"
                    >
                      Change country
                    </button>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {currentCountry.supportedLocales.map((loc) => {
                      const locObj = getLocale(loc);
                      if (!locObj) return null;
                      const isSelected = activeLocale === loc;
                      return (
                        <button
                          key={loc}
                          type="button"
                          disabled={saving}
                          onClick={() => handleSelectLocale(loc)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                            isSelected
                              ? "bg-brand text-white font-semibold"
                              : "bg-surface border border-line text-ink-muted hover:border-line-strong hover:text-ink"
                          }`}
                        >
                          {locObj.nativeName} ({locObj.languageName})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Language list */}
              <div
                role="listbox"
                aria-label="Supported languages"
                className="max-h-56 space-y-1 overflow-y-auto pr-0.5"
              >
                {filteredLanguages.length === 0 ? (
                  <p className="py-4 text-center text-xs text-ink-subtle">
                    No matching languages found.
                  </p>
                ) : (
                  filteredLanguages.map((item) => {
                    const isSelected = activeLocale === item.locale;
                    return (
                      <button
                        key={item.locale}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={saving}
                        onClick={() => handleSelectLocale(item.locale)}
                        className={`flex min-h-10 w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs outline-none transition-colors ${
                          isSelected
                            ? "bg-brand-soft font-semibold text-brand-soft-text"
                            : "text-ink-muted hover:bg-surface-raised hover:text-ink focus-visible:bg-surface-raised"
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="font-medium text-ink">{item.nativeName}</span>
                          <span className="ml-2 text-ink-subtle">({item.languageName})</span>
                          {item.direction === "rtl" && (
                            <span className="ml-1.5 rounded-sm bg-line px-1 py-0.5 text-[9px] font-bold uppercase text-ink-subtle">
                              RTL
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-ink-subtle">{item.locale}</span>
                          {isSelected && <Check size={14} className="text-brand shrink-0" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Reset to Default Button */}
              {activeLocale !== DEFAULT_LOCALE && (
                <div className="mt-2.5 border-t border-line/60 pt-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSelectLocale(DEFAULT_LOCALE)}
                    className="flex min-h-9 w-full items-center justify-center rounded-xl bg-surface-raised px-3 text-xs font-semibold text-ink-muted hover:text-brand"
                  >
                    Reset to English (default)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Countries */}
          {activeTab === "countries" && (
            <div>
              <p className="mb-2 text-[11px] text-ink-subtle">
                Sets currency and number formatting. Does not change interface language.
              </p>
              <div
                role="listbox"
                aria-label="Supported countries"
                className="max-h-64 space-y-1 overflow-y-auto pr-0.5"
              >
                {filteredCountries.length === 0 ? (
                  <p className="py-4 text-center text-xs text-ink-subtle">
                    No matching countries found.
                  </p>
                ) : (
                  filteredCountries.map((c) => {
                    const isSelected = selectedCountryCode === c.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelectCountry(c.code)}
                        className={`flex min-h-10 w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs outline-none transition-colors ${
                          isSelected
                            ? "bg-brand-soft font-semibold text-brand-soft-text"
                            : "text-ink-muted hover:bg-surface-raised hover:text-ink focus-visible:bg-surface-raised"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-bold text-ink">{c.code}</span>
                          <span className="truncate">{c.countryName}</span>
                          <span className="text-[11px] text-ink-subtle font-mono">
                            ({c.currency})
                          </span>
                        </div>
                        {isSelected && <Check size={14} className="text-brand shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <p role="alert" className="mt-2 text-xs text-danger break-words">
              {error}
            </p>
          )}

          {/* Saving Indicator */}
          {saving && (
            <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-brand font-medium">
              <LoaderCircle size={13} className="animate-spin" />
              <span>Updating…</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
