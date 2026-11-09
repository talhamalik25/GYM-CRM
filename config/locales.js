export const DEFAULT_LOCALE = "en-US";
export const DEFAULT_COUNTRY_CODE = "PK";
export const DEFAULT_TIME_ZONE = "Asia/Karachi";

export const LOCALES = [
  { locale: "en-US", languageName: "English", nativeName: "English", direction: "ltr", translationStatus: "complete" },
  { locale: "en-GB", languageName: "English", nativeName: "English", direction: "ltr", translationStatus: "complete" },
  { locale: "en-MY", languageName: "English", nativeName: "English", direction: "ltr", translationStatus: "complete" },
  { locale: "en-AU", languageName: "English", nativeName: "English", direction: "ltr", translationStatus: "complete" },
  { locale: "en-CA", languageName: "English", nativeName: "English", direction: "ltr", translationStatus: "complete" },
  { locale: "ur-PK", languageName: "Urdu", nativeName: "اردو", direction: "rtl", translationStatus: "complete" },
  { locale: "ar-SA", languageName: "Arabic", nativeName: "العربية", direction: "rtl", translationStatus: "complete" },
  { locale: "ar-AE", languageName: "Arabic", nativeName: "العربية", direction: "rtl", translationStatus: "complete" },
  { locale: "ar-QA", languageName: "Arabic", nativeName: "العربية", direction: "rtl", translationStatus: "complete" },
  { locale: "fr-FR", languageName: "French", nativeName: "français", direction: "ltr", translationStatus: "complete" },
  { locale: "de-DE", languageName: "German", nativeName: "Deutsch", direction: "ltr", translationStatus: "complete" },
  { locale: "es-ES", languageName: "Spanish", nativeName: "español", direction: "ltr", translationStatus: "complete" },
  { locale: "zh-CN", languageName: "Simplified Chinese", nativeName: "简体中文", direction: "ltr", translationStatus: "in-progress" },
  { locale: "ja-JP", languageName: "Japanese", nativeName: "日本語", direction: "ltr", translationStatus: "in-progress" },
  { locale: "tr-TR", languageName: "Turkish", nativeName: "Türkçe", direction: "ltr", translationStatus: "complete" },
  { locale: "pt-BR", languageName: "Portuguese", nativeName: "português", direction: "ltr", translationStatus: "complete" },
  { locale: "hi-IN", languageName: "Hindi", nativeName: "हिन्दी", direction: "ltr", translationStatus: "complete" },
  { locale: "bn-BD", languageName: "Bengali", nativeName: "বাংলা", direction: "ltr", translationStatus: "in-progress" },
];

export const COUNTRIES = [
  { code: "PK", countryName: "Pakistan", defaultLocale: "ur-PK", supportedLocales: ["ur-PK", "en-US"], currency: "PKR", formatLocale: "en-PK" },
  { code: "US", countryName: "United States", defaultLocale: "en-US", supportedLocales: ["en-US"], currency: "USD", formatLocale: "en-US" },
  { code: "GB", countryName: "United Kingdom", defaultLocale: "en-GB", supportedLocales: ["en-GB"], currency: "GBP", formatLocale: "en-GB" },
  { code: "MY", countryName: "Malaysia", defaultLocale: "en-MY", supportedLocales: ["en-MY"], currency: "MYR", formatLocale: "en-MY" },
  { code: "AU", countryName: "Australia", defaultLocale: "en-AU", supportedLocales: ["en-AU"], currency: "AUD", formatLocale: "en-AU" },
  { code: "CA", countryName: "Canada", defaultLocale: "en-CA", supportedLocales: ["en-CA"], currency: "CAD", formatLocale: "en-CA" },
  { code: "SA", countryName: "Saudi Arabia", defaultLocale: "ar-SA", supportedLocales: ["ar-SA", "en-US"], currency: "SAR", formatLocale: "en-SA" },
  { code: "AE", countryName: "United Arab Emirates", defaultLocale: "ar-AE", supportedLocales: ["ar-AE", "en-US"], currency: "AED", formatLocale: "en-AE" },
  { code: "QA", countryName: "Qatar", defaultLocale: "ar-QA", supportedLocales: ["ar-QA", "en-US"], currency: "QAR", formatLocale: "en-QA" },
  { code: "FR", countryName: "France", defaultLocale: "fr-FR", supportedLocales: ["fr-FR", "en-US"], currency: "EUR", formatLocale: "en-FR" },
  { code: "DE", countryName: "Germany", defaultLocale: "de-DE", supportedLocales: ["de-DE", "en-US"], currency: "EUR", formatLocale: "en-DE" },
  { code: "ES", countryName: "Spain", defaultLocale: "es-ES", supportedLocales: ["es-ES", "en-US"], currency: "EUR", formatLocale: "en-ES" },
  { code: "CN", countryName: "China", defaultLocale: "zh-CN", supportedLocales: ["zh-CN", "en-US"], currency: "CNY", formatLocale: "en-CN" },
  { code: "JP", countryName: "Japan", defaultLocale: "ja-JP", supportedLocales: ["ja-JP", "en-US"], currency: "JPY", formatLocale: "en-JP" },
  { code: "TR", countryName: "Türkiye", aliases: ["Turkey"], defaultLocale: "tr-TR", supportedLocales: ["tr-TR", "en-US"], currency: "TRY", formatLocale: "en-TR" },
  { code: "BR", countryName: "Brazil", defaultLocale: "pt-BR", supportedLocales: ["pt-BR", "en-US"], currency: "BRL", formatLocale: "en-BR" },
  { code: "IN", countryName: "India", defaultLocale: "hi-IN", supportedLocales: ["hi-IN", "en-US"], currency: "INR", formatLocale: "en-IN" },
  { code: "BD", countryName: "Bangladesh", defaultLocale: "bn-BD", supportedLocales: ["bn-BD", "en-US"], currency: "BDT", formatLocale: "en-BD" },
];

export const AVAILABLE_LOCALES = LOCALES.filter(({ translationStatus }) => translationStatus === "complete");
const availableLocaleIds = new Set(AVAILABLE_LOCALES.map(({ locale }) => locale));
const countryByCode = new Map(COUNTRIES.map((country) => [country.code, country]));
const localeById = new Map(LOCALES.map((locale) => [locale.locale, locale]));

export function getCountry(countryCode) {
  return typeof countryCode === "string" ? countryByCode.get(countryCode.trim().toUpperCase()) || null : null;
}

export function getLocale(locale) {
  return typeof locale === "string" ? localeById.get(locale) || null : null;
}

export function isAvailableLocale(locale) {
  return typeof locale === "string" && availableLocaleIds.has(locale);
}

export function resolveLocale(locale) {
  if (isAvailableLocale(locale)) return locale;
  return DEFAULT_LOCALE;
}

export function resolveEffectiveLocale({ userLocale, gymLocale, explicitLocale, countryLocale } = {}) {
  // Precedence per Default Language Policy:
  // 1. Explicit user-selected language (session or cookie)
  if (isAvailableLocale(explicitLocale)) return explicitLocale;
  if (isAvailableLocale(userLocale)) return userLocale;
  // 2. Gym default language (if active and available)
  if (isAvailableLocale(gymLocale)) return gymLocale;
  // 3. Country default, if available.
  if (isAvailableLocale(countryLocale)) return countryLocale;
  // 4. System default: English (en-US)
  return DEFAULT_LOCALE;
}

export function getLocaleDirection(locale) {
  return getLocale(locale)?.direction || "ltr";
}

export function getCountryDefaultLocale(countryCode) {
  const country = getCountry(countryCode);
  if (!country) return DEFAULT_LOCALE;
  if (isAvailableLocale(country.defaultLocale)) return country.defaultLocale;
  return country.supportedLocales.find(isAvailableLocale) || DEFAULT_LOCALE;
}

export function resolveCountryChangeLocale({ currentLocale, currentCountryCode, nextCountryCode } = {}) {
  const currentCountryDefault = getCountryDefaultLocale(currentCountryCode);
  if (isAvailableLocale(currentLocale) && currentLocale !== currentCountryDefault) return currentLocale;
  return getCountryDefaultLocale(nextCountryCode);
}

export function isSupportedCountry(countryCode) {
  return Boolean(getCountry(countryCode));
}

function normalizeSearchText(value) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase();
}

export function searchCountries(query) {
  const normalizedQuery = typeof query === "string" ? normalizeSearchText(query.trim()) : "";
  if (!normalizedQuery) return COUNTRIES;

  return COUNTRIES.filter((country) => {
    const localeDetails = country.supportedLocales.map(getLocale).filter(Boolean);
    const searchValues = [
      country.countryName,
      country.code,
      country.currency,
      ...(country.aliases || []),
      country.defaultLocale,
      ...localeDetails.flatMap(({ locale, languageName, nativeName }) => [locale, languageName, nativeName]),
    ];
    return searchValues.some((value) => normalizeSearchText(value).includes(normalizedQuery));
  });
}
