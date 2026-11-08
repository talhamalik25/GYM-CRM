"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import {
  DEFAULT_LOCALE,
  getCountry,
  getLocaleDirection,
  isAvailableLocale,
  isSupportedCountry,
} from "../../config/locales.js";

const LocalePreferenceContext = createContext(null);

function setCookie(name, value, maxAge) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function deleteCookie(name) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function mergeMessages(fallback, current) {
  if (!current || typeof current !== "object") return fallback;
  const result = { ...fallback };
  for (const [key, val] of Object.entries(current)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      result[key] = mergeMessages(fallback[key] || {}, val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

const loaders = {
  "en-US": () => import("../../locales/en-US.json"),
  "ur-PK": () => import("../../locales/ur-PK.json"),
  "ar-SA": () => import("../../locales/ar-SA.json"),
  "fr-FR": () => import("../../locales/fr-FR.json"),
  "es-ES": () => import("../../locales/es-ES.json"),
  "de-DE": () => import("../../locales/de-DE.json"),
  "pt-BR": () => import("../../locales/pt-BR.json"),
  "tr-TR": () => import("../../locales/tr-TR.json"),
  "hi-IN": () => import("../../locales/hi-IN.json"),
};

async function loadClientMessages(targetLocale) {
  const enMod = await loaders["en-US"]();
  const enMessages = enMod.default || enMod;
  if (!targetLocale || targetLocale === "en-US") return enMessages;
  const loader = loaders[targetLocale];
  if (!loader) return enMessages;
  const targetMod = await loader();
  const targetMessages = targetMod.default || targetMod;
  return mergeMessages(enMessages, targetMessages);
}

export function useLocalePreferences() {
  const context = useContext(LocalePreferenceContext);
  if (!context) throw new Error("useLocalePreferences must be used inside LocaleProvider.");
  return context;
}

export default function LocaleProvider({ locale: initialLocale, messages: initialMessages, timeZone, initialCountryCode = "PK", children }) {
  const router = useRouter();

  const [prevInitialLocale, setPrevInitialLocale] = useState(initialLocale);
  const [currentLocale, setCurrentLocale] = useState(initialLocale || DEFAULT_LOCALE);
  const [prevInitialMessages, setPrevInitialMessages] = useState(initialMessages);
  const [currentMessages, setCurrentMessages] = useState(initialMessages || {});
  const [prevInitialCountryCode, setPrevInitialCountryCode] = useState(initialCountryCode);
  const [currentCountryCode, setCurrentCountryCode] = useState(getCountry(initialCountryCode)?.code || "PK");

  // Adjust state during render when server props change (React-recommended pattern)
  if (initialLocale !== prevInitialLocale) {
    setPrevInitialLocale(initialLocale);
    setCurrentLocale(initialLocale || DEFAULT_LOCALE);
  }

  if (initialMessages !== prevInitialMessages) {
    setPrevInitialMessages(initialMessages);
    setCurrentMessages(initialMessages || {});
  }

  if (initialCountryCode !== prevInitialCountryCode) {
    setPrevInitialCountryCode(initialCountryCode);
    setCurrentCountryCode(getCountry(initialCountryCode)?.code || "PK");
  }

  // Synchronize document lang and dir attributes when currentLocale changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = currentLocale;
      document.documentElement.dir = getLocaleDirection(currentLocale);
    }
  }, [currentLocale]);

  const changeLocale = useCallback(
    async (nextLocale) => {
      if (!isAvailableLocale(nextLocale)) throw new Error("This language is not available yet.");

      // 1. Set cookie immediately (works for both visitors and logged-in users)
      setCookie("fitivo-locale", nextLocale, 60 * 60 * 24 * 365);

      // 2. Load client messages and apply immediately without requiring page reload
      try {
        const loadedMessages = await loadClientMessages(nextLocale);
        setCurrentMessages(loadedMessages);
        setCurrentLocale(nextLocale);
        if (typeof document !== "undefined") {
          document.documentElement.lang = nextLocale;
          document.documentElement.dir = getLocaleDirection(nextLocale);
        }
      } catch (err) {
        console.error("Failed to load client messages:", err);
      }

      // 3. Persist to account if authenticated
      try {
        const response = await fetch("/api/account/locale", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: nextLocale }),
        });
        if (!response.ok && response.status !== 401) {
          throw new Error("Could not save your language preference.");
        }
      } catch {
        throw new Error("Could not save your language preference.");
      }

      // 4. Trigger router refresh for server-side consistency
      router.refresh();
    },
    [router]
  );

  const resetLocale = useCallback(async () => {
    deleteCookie("fitivo-locale");
    try {
      const enMessages = await loadClientMessages(DEFAULT_LOCALE);
      setCurrentMessages(enMessages);
      setCurrentLocale(DEFAULT_LOCALE);
      if (typeof document !== "undefined") {
        document.documentElement.lang = DEFAULT_LOCALE;
        document.documentElement.dir = getLocaleDirection(DEFAULT_LOCALE);
      }
    } catch (err) {
      console.error("Failed to reset messages:", err);
    }

    try {
      const response = await fetch("/api/account/locale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: null }),
      });
      if (!response.ok && response.status !== 401) {
        throw new Error("Could not reset your language preference.");
      }
    } catch {
      throw new Error("Could not reset your language preference.");
    }
    router.refresh();
  }, [router]);

  const setCountry = useCallback(
    (countryCode) => {
      const country = getCountry(countryCode);
      if (!country || !isSupportedCountry(countryCode)) throw new Error("Select a supported country.");
      const storedCountry = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith("fitivo-country="))
        ?.slice("fitivo-country=".length);
      if (storedCountry && decodeURIComponent(storedCountry).toUpperCase() === country.code) return;
      setCookie("fitivo-country", country.code, 60 * 60 * 24 * 365);
      setCurrentCountryCode(country.code);
      router.refresh();
    },
    [router]
  );

  const value = { locale: currentLocale, countryCode: currentCountryCode, changeLocale, resetLocale, setCountry };

  return (
    <LocalePreferenceContext.Provider value={value}>
      <NextIntlClientProvider locale={currentLocale} messages={currentMessages} timeZone={timeZone}>
        {children}
      </NextIntlClientProvider>
    </LocalePreferenceContext.Provider>
  );
}
