import test from "node:test";
import assert from "node:assert/strict";
import {
  AVAILABLE_LOCALES,
  COUNTRIES,
  DEFAULT_LOCALE,
  getCountry,
  getLocaleDirection,
  isAvailableLocale,
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

test("only completed English resources are exposed and missing locales fall back safely", () => {
  assert.ok(AVAILABLE_LOCALES.length > 0);
  assert.ok(AVAILABLE_LOCALES.every(({ translationStatus }) => translationStatus === "complete"));
  assert.equal(isAvailableLocale("ur-PK"), false);
  assert.equal(resolveLocale("ur-PK", "PK"), DEFAULT_LOCALE);
  assert.equal(resolveLocale("ar-SA", "SA"), DEFAULT_LOCALE);
  assert.equal(resolveLocale("en-GB", "PK"), "en-GB");
  assert.equal(resolveLocale("unsupported", "unknown"), DEFAULT_LOCALE);
  assert.equal(getLocaleDirection("ar-SA"), "rtl");
});

test("locale formatting changes presentation without changing the amount", () => {
  const euroAmount = formatCurrency(1234.5, { countryCode: "FR" });
  assert.match(euroAmount, /EUR|€/);
  assert.match(euroAmount, /1,234\.50/);
  assert.equal(formatNumber(1234.5, { locale: "de-DE" }), "1.234,5");
  assert.equal(formatDate("not-a-date"), "—");
});
