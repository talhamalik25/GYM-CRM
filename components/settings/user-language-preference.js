"use client";

import { useEffect, useState } from "react";
import { AVAILABLE_LOCALES } from "../../config/locales.js";
import { useLocalePreferences } from "../i18n/locale-provider.js";
import Button from "../ui/button.js";
import Select from "../ui/select.js";

export default function UserLanguagePreference() {
  const { changeLocale, resetLocale } = useLocalePreferences();
  const [savedLocale, setSavedLocale] = useState("");
  const [draftLocale, setDraftLocale] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/account/locale", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error?.message || "Could not load your language preference.");
        }
        if (active) {
          setSavedLocale(result.data.locale || "");
          setDraftLocale(result.data.locale || "");
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Could not load your language preference.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function savePreference() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (draftLocale) await changeLocale(draftLocale);
      else await resetLocale();
      setSavedLocale(draftLocale);
      setSuccess("Your language preference was saved.");
    } catch (requestError) {
      setError(requestError.message || "Could not save your language preference.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-3 border-t border-line pt-5">
      <div>
        <h2 className="text-sm font-semibold text-ink">Your language preference</h2>
        <p className="mt-1 text-xs text-ink-subtle">
          This personal override stays active when you change countries. Choose the default to follow your workspace or country.
        </p>
      </div>
      {loading ? (
        <p role="status" className="text-sm text-ink-muted">Loading language preference…</p>
      ) : (
        <>
          {error && <p role="alert" className="text-sm text-error">{error}</p>}
          {success && <p role="status" className="text-sm text-success">{success}</p>}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Select
              id="user-language-preference"
              label="Language"
              value={draftLocale}
              onChange={(event) => {
                setDraftLocale(event.target.value);
                setError("");
                setSuccess("");
              }}
              disabled={saving}
            >
              <option value="">Use workspace or country default</option>
              {AVAILABLE_LOCALES.map(({ locale, nativeName, languageName }) => (
                <option key={locale} value={locale}>{nativeName} ({languageName})</option>
              ))}
            </Select>
            <Button
              type="button"
              variant="secondary"
              disabled={saving || draftLocale === savedLocale}
              onClick={savePreference}
            >
              {saving ? "Saving…" : "Save language"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
