import test from "node:test";
import assert from "node:assert/strict";
import {
  AVAILABLE_LOCALES,
  COUNTRIES,
  DEFAULT_LOCALE,
  getCountry,
  getLocaleDirection,
  isAvailableLocale,
  resolveEffectiveLocale,
  resolveLocale,
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

  // Default Language Policy: explicit choice takes precedence; otherwise defaults to en-US
  assert.equal(resolveEffectiveLocale({ userLocale: "en-GB", gymLocale: "en-US", countryCode: "PK" }), "en-GB");
  assert.equal(resolveEffectiveLocale({ userLocale: "ur-PK", gymLocale: "en-US", countryCode: "PK" }), "ur-PK");
  assert.equal(resolveEffectiveLocale({ gymLocale: "en-GB", countryCode: "PK" }), "en-GB");
  assert.equal(resolveEffectiveLocale({ userLocale: "zh-CN", gymLocale: "ja-JP", countryCode: "PK" }), DEFAULT_LOCALE);

  // RTL direction check
  assert.equal(getLocaleDirection("ar-SA"), "rtl");
  assert.equal(getLocaleDirection("ur-PK"), "rtl");
  assert.equal(getLocaleDirection("en-US"), "ltr");
});

test("locale formatting changes presentation without changing the amount", () => {
  const euroAmount = formatCurrency(1234.5, { countryCode: "FR" });
  assert.match(euroAmount, /EUR|€/);
  assert.match(euroAmount, /1,234\.50/);
  assert.equal(formatNumber(1234.5, { locale: "de-DE" }), "1.234,5");
  assert.equal(formatDate("not-a-date"), "—");
});
