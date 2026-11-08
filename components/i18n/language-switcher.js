"use client";

import { useEffect, useRef, useState } from "react";
import { Globe2 } from "lucide-react";
import { AVAILABLE_LOCALES } from "../../config/locales.js";
import { useLocalePreferences } from "./locale-provider.js";

export default function LanguageSwitcher() {
  const { changeLocale, resetLocale } = useLocalePreferences();
  const [open, setOpen] = useState(false);
  const [preference, setPreference] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const root = useRef(null);
  const trigger = useRef(null);

  useEffect(() => {
    let active = true;
    fetch("/api/account/locale", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error?.message || "Could not load language preference.");
        if (active) setPreference(result.data.locale);
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    function dismiss(event) {
      if (!root.current?.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  async function selectLocale(locale) {
    setSaving(true);
    setError("");
    try {
      if (locale) await changeLocale(locale);
      else await resetLocale();
      setPreference(locale || null);
      setOpen(false);
    } catch (requestError) {
      setError(requestError.message || "Could not save your language preference.");
    } finally {
      setSaving(false);
    }
  }

  return <div ref={root} className="relative">
    <button
      ref={trigger}
      type="button"
      aria-label="Choose language"
      aria-expanded={open}
      aria-haspopup="dialog"
      onClick={() => setOpen((value) => !value)}
      className="flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none"
    >
      <Globe2 size={16} aria-hidden="true" />
      <span className="hidden sm:inline">{AVAILABLE_LOCALES.find(({ locale }) => locale === preference)?.nativeName || "Language"}</span>
    </button>
    {open && <div role="dialog" aria-label="Choose language" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 rounded-xl border border-line bg-surface p-3 text-ink shadow-lg shadow-slate-900/10">
      <p className="px-2 pb-2 text-sm font-semibold">Language</p>
      {loading ? <p role="status" className="px-2 py-2 text-sm text-ink-muted">Loading language preference…</p> : <>
        <button type="button" disabled={saving} aria-pressed={!preference} onClick={() => selectLocale(null)} className="flex min-h-11 w-full items-center rounded-lg px-2 text-left text-sm text-ink-muted hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-60">
          Use workspace default
        </button>
        {AVAILABLE_LOCALES.map(({ locale, nativeName }) => <button key={locale} type="button" disabled={saving} aria-pressed={preference === locale} onClick={() => selectLocale(locale)} className="flex min-h-11 w-full items-center justify-between rounded-lg px-2 text-left text-sm text-ink-muted hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-60">
          <span>{nativeName} <span className="text-xs text-ink-subtle">({locale})</span></span>
          {preference === locale && <span aria-hidden="true">✓</span>}
        </button>)}
      </>}
      {error && <p role="alert" className="mt-2 px-2 text-xs text-error">{error}</p>}
    </div>}
  </div>;
}
