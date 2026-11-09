import test from "node:test";
import assert from "node:assert/strict";
import {
  AVAILABLE_LOCALES,
  COUNTRIES,
  DEFAULT_COUNTRY_CODE,
  DEFAULT_LOCALE,
  getCountry,
  getCountryDefaultLocale,
  getLocaleDirection,
  isAvailableLocale,
  resolveCountryChangeLocale,
  resolveEffectiveLocale,
  resolveLocale,
  searchCountries,
} from "../config/locales.js";
import { formatCurrency, formatDate, formatNumber } from "../lib/localeFormatting.js";

test("country configuration includes requested defaults and explicit supported locales", () => {
  const expected = {
    PK: ["ur-PK", "PKR"],
    US: ["en-US", "USD"],
    GB: ["en-GB", "GBP"],
    SA: ["ar-SA", "SAR"],
    AE: ["ar-AE", "AED"],
    QA: ["ar-QA", "QAR"],
    FR: ["fr-FR", "EUR"],
    DE: ["de-DE", "EUR"],
    ES: ["es-ES", "EUR"],
    CN: ["zh-CN", "CNY"],
    JP: ["ja-JP", "JPY"],
    TR: ["tr-TR", "TRY"],
    BR: ["pt-BR", "BRL"],
    IN: ["hi-IN", "INR"],
    BD: ["bn-BD", "BDT"],
  };
  for (const [code, [defaultLocale, currency]] of Object.entries(expected)) {
    const country = getCountry(code);
    assert.ok(country, `missing country ${code}`);
    assert.equal(country.defaultLocale, defaultLocale);
    assert.equal(country.currency, currency);
    assert.ok(country.supportedLocales.includes(defaultLocale));
  }
  assert.ok(COUNTRIES.length >= Object.keys(expected).length);
  assert.equal(new Set(COUNTRIES.map(({ code }) => code)).size, COUNTRIES.length);
});

test("only completed resources are exposed and missing locales fall back safely", () => {
  assert.ok(AVAILABLE_LOCALES.length > 0);
  assert.ok(AVAILABLE_LOCALES.every(({ translationStatus }) => translationStatus === "complete"));

  // Completed languages are available
  assert.equal(isAvailableLocale("ur-PK"), true);
  assert.equal(isAvailableLocale("ar-SA"), true);
  assert.equal(isAvailableLocale("fr-FR"), true);
  assert.equal(resolveLocale("ur-PK"), "ur-PK");
  assert.equal(resolveLocale("ar-SA"), "ar-SA");
  assert.equal(resolveLocale("en-GB"), "en-GB");

  // In-progress / unsupported languages fall back to default English
  assert.equal(isAvailableLocale("zh-CN"), false);
  assert.equal(isAvailableLocale("ja-JP"), false);
  assert.equal(resolveLocale("zh-CN"), DEFAULT_LOCALE);
  assert.equal(resolveLocale("unsupported"), DEFAULT_LOCALE);

  // Explicit choices and gym defaults take precedence over a selected country's default.
  assert.equal(resolveEffectiveLocale({ explicitLocale: "en-GB", countryLocale: "ur-PK" }), "en-GB");
  assert.equal(resolveEffectiveLocale({ userLocale: "ur-PK", gymLocale: "en-US", countryLocale: "ar-SA" }), "ur-PK");
  assert.equal(resolveEffectiveLocale({ gymLocale: "en-GB", countryLocale: "ur-PK" }), "en-GB");
  assert.equal(resolveEffectiveLocale({ countryLocale: "ar-SA" }), "ar-SA");
  assert.equal(resolveEffectiveLocale({ countryLocale: "zh-CN" }), DEFAULT_LOCALE);
  assert.equal(getCountryDefaultLocale("CN"), DEFAULT_LOCALE);
  assert.equal(getCountryDefaultLocale(DEFAULT_COUNTRY_CODE), "ur-PK");

  // RTL direction check
  assert.equal(getLocaleDirection("ar-SA"), "rtl");
  assert.equal(getLocaleDirection("ur-PK"), "rtl");
  assert.equal(getLocaleDirection("en-US"), "ltr");
});

test("country selector search matches names, aliases, codes, locales, and languages once per country", () => {
  assert.deepEqual(searchCountries("Pakistan").map(({ code }) => code), ["PK"]);
  assert.deepEqual(searchCountries("Urdu").map(({ code }) => code), ["PK"]);
  assert.deepEqual(searchCountries("Turkey").map(({ code }) => code), ["TR"]);
  assert.deepEqual(searchCountries("tr-TR").map(({ code }) => code), ["TR"]);
  assert.deepEqual(searchCountries("Arabic").map(({ code }) => code), ["SA", "AE", "QA"]);
  const englishCountries = searchCountries("English");
  assert.ok(englishCountries.some(({ code }) => code === "US"));
  assert.ok(englishCountries.some(({ code }) => code === "GB"));
  assert.equal(new Set(englishCountries.map(({ code }) => code)).size, englishCountries.length);
});

test("country changes apply the new default unless the user has an explicit language override", () => {
  assert.equal(
    resolveCountryChangeLocale({ currentLocale: "ur-PK", currentCountryCode: "PK", nextCountryCode: "SA" }),
    "ar-SA"
  );
  assert.equal(
    resolveCountryChangeLocale({ currentLocale: "en-US", currentCountryCode: "PK", nextCountryCode: "SA" }),
    "en-US"
  );
  assert.equal(
    resolveCountryChangeLocale({ currentLocale: "fr-FR", currentCountryCode: "PK", nextCountryCode: "SA" }),
    "fr-FR"
  );
});

test("locale formatting changes presentation without changing the amount", () => {
  const euroAmount = formatCurrency(1234.5, { countryCode: "FR" });
  assert.match(euroAmount, /EUR|€/);
  assert.match(euroAmount, /1,234\.50/);
  assert.equal(formatNumber(1234.5, { locale: "de-DE" }), "1.234,5");
  assert.equal(formatDate("not-a-date"), "—");
});
