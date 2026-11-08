export const DEFAULT_LOCALE = "en-US";
export const DEFAULT_TIME_ZONE = "Asia/Karachi";

export const LOCALES = [
  { locale: "en-US", languageName: "English", nativeName: "English", direction: "ltr", translationStatus: "complete" },
  { locale: "en-GB", languageName: "English", nativeName: "English", direction: "ltr", translationStatus: "complete" },
  { locale: "en-MY", languageName: "English", nativeName: "English", direction: "ltr", translationStatus: "complete" },
  { locale: "en-AU", languageName: "English", nativeName: "English", direction: "ltr", translationStatus: "complete" },
  { locale: "en-CA", languageName: "English", nativeName: "English", direction: "ltr", translationStatus: "complete" },
  { locale: "ur-PK", languageName: "Urdu", nativeName: "اردو", direction: "rtl", translationStatus: "in-progress" },
  { locale: "ar-SA", languageName: "Arabic", nativeName: "العربية", direction: "rtl", translationStatus: "in-progress" },
  { locale: "ar-AE", languageName: "Arabic", nativeName: "العربية", direction: "rtl", translationStatus: "in-progress" },
  { locale: "ar-QA", languageName: "Arabic", nativeName: "العربية", direction: "rtl", translationStatus: "in-progress" },
  { locale: "fr-FR", languageName: "French", nativeName: "français", direction: "ltr", translationStatus: "in-progress" },
  { locale: "de-DE", languageName: "German", nativeName: "Deutsch", direction: "ltr", translationStatus: "in-progress" },
  { locale: "es-ES", languageName: "Spanish", nativeName: "español", direction: "ltr", translationStatus: "in-progress" },
  { locale: "zh-CN", languageName: "Simplified Chinese", nativeName: "简体中文", direction: "ltr", translationStatus: "in-progress" },
  { locale: "ja-JP", languageName: "Japanese", nativeName: "日本語", direction: "ltr", translationStatus: "in-progress" },
  { locale: "tr-TR", languageName: "Turkish", nativeName: "Türkçe", direction: "ltr", translationStatus: "in-progress" },
  { locale: "pt-BR", languageName: "Portuguese", nativeName: "português", direction: "ltr", translationStatus: "in-progress" },
  { locale: "hi-IN", languageName: "Hindi", nativeName: "हिन्दी", direction: "ltr", translationStatus: "in-progress" },
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
  { code: "TR", countryName: "Turkey", defaultLocale: "tr-TR", supportedLocales: ["tr-TR", "en-US"], currency: "TRY", formatLocale: "en-TR" },
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

export function resolveLocale(locale, countryCode) {
  if (isAvailableLocale(locale)) return locale;
  const country = getCountry(countryCode);
  if (country && isAvailableLocale(country.defaultLocale)) return country.defaultLocale;
  return DEFAULT_LOCALE;
}

export function getLocaleDirection(locale) {
  return getLocale(locale)?.direction || "ltr";
}

export function getCountryDefaultLocale(countryCode) {
  return getCountry(countryCode)?.defaultLocale || DEFAULT_LOCALE;
}

export function isSupportedCountry(countryCode) {
  return Boolean(getCountry(countryCode));
}
