"use client";

import { createContext, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { DEFAULT_LOCALE, isAvailableLocale, isSupportedCountry } from "../../config/locales.js";

const LocalePreferenceContext = createContext(null);

function setCookie(name, value, maxAge) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function useLocalePreferences() {
  const context = useContext(LocalePreferenceContext);
  if (!context) throw new Error("useLocalePreferences must be used inside LocaleProvider.");
  return context;
}

export default function LocaleProvider({ locale, messages, timeZone, children }) {
  const router = useRouter();

  const changeLocale = useCallback(async (nextLocale) => {
    if (!isAvailableLocale(nextLocale)) throw new Error("This language is not available yet.");
    const response = await fetch("/api/account/locale", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: nextLocale }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error?.message || "Could not save your language preference.");
    router.refresh();
  }, [router]);

  const resetLocale = useCallback(async () => {
    const response = await fetch("/api/account/locale", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: null }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error?.message || "Could not reset your language preference.");
    router.refresh();
  }, [router]);

  const setCountry = useCallback((countryCode) => {
    if (!isSupportedCountry(countryCode)) throw new Error("Select a supported country.");
    const storedCountry = document.cookie.split("; ").find((cookie) => cookie.startsWith("fitivo-country="))?.slice("fitivo-country=".length);
    if (storedCountry && decodeURIComponent(storedCountry).toUpperCase() === countryCode.toUpperCase()) return;
    setCookie("fitivo-country", countryCode, 60 * 60 * 24 * 365);
    router.refresh();
  }, [router]);

  const value = { locale: locale || DEFAULT_LOCALE, changeLocale, resetLocale, setCountry };
  return <LocalePreferenceContext.Provider value={value}>
    <NextIntlClientProvider locale={value.locale} messages={messages} timeZone={timeZone}>
      {children}
    </NextIntlClientProvider>
  </LocalePreferenceContext.Provider>;
}
