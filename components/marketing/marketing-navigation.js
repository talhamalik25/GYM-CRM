"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, Menu, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import MarketingContainer from "./marketing-container.js";
import FitivoLogo from "../brand/fitivo-logo.js";
import MarketingShellAction from "./marketing-shell-action.js";
import LanguageSwitcher from "../i18n/language-switcher.js";

const navigationLinks = [
  ["features", "/features"],
  ["pricing", "/pricing"],
  ["productTour", "/demo"],
  ["guide", "/guide"],
  ["about", "/about"],
  ["contact", "/contact"],
];

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";
const navLinkClass =
  "inline-flex h-9 items-center rounded-md px-3 text-[13px] font-medium text-slate-600 transition-[color,background-color] hover:bg-slate-100/70 hover:text-slate-900 aria-[current=page]:bg-slate-100/90 aria-[current=page]:text-indigo-600 motion-reduce:transition-none " +
  focusRing;

export default function MarketingNavigation() {
  const pathname = usePathname();
  const t = useTranslations("marketing.navigation");
  const headerRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 12);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    function onEscape(event) {
      if (event.key === "Escape") setMobileOpen(false);
    }

    function onPointerDown(event) {
      if (!headerRef.current?.contains(event.target)) {
        setMobileOpen(false);
      }
    }

    document.addEventListener("keydown", onEscape);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("keydown", onEscape);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [mobileOpen]);

  function closeMenus() {
    setMobileOpen(false);
  }

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-[70] transition-[background-color,border-color,box-shadow] duration-200 ${
        scrolled
          ? "border-b border-slate-200/80 bg-white/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] backdrop-blur-md"
          : "border-b border-slate-100 bg-white"
      } font-sans text-slate-900`}
    >
      <MarketingContainer className="flex h-[72px] max-w-[1280px] items-center justify-between gap-3">
        {/* Brand logo */}
        <Link
          href="/"
          aria-label={t("fitivoHome") || "Fitivo home"}
          onClick={closeMenus}
          className={"group inline-flex min-h-11 w-36 shrink-0 items-center overflow-hidden " + focusRing}
        >
          <FitivoLogo
            width={180}
            height={56}
            priority
            className="-ml-4 rtl:-mr-4 rtl:ml-0 transition-opacity group-hover:opacity-90 [&_img]:max-w-none"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label={t("mainNavigation") || "Main navigation"}
          className="ml-auto mr-8 hidden items-center gap-1 xl:flex rtl:ml-8 rtl:mr-auto"
        >
          {navigationLinks.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={navLinkClass}
              aria-current={pathname === href ? "page" : undefined}
              onClick={closeMenus}
            >
              {t(label)}
            </Link>
          ))}
        </nav>

        {/* Right side actions: Language, Login, Primary CTA */}
        <div className="flex items-center justify-end gap-2.5 sm:gap-3">
          <LanguageSwitcher />

          <Link
            href="/login"
            className={
              "hidden h-9 items-center whitespace-nowrap rounded-md px-3 text-[13px] font-medium text-slate-600 transition-[color,background-color] hover:bg-slate-100/70 hover:text-slate-950 motion-reduce:transition-none sm:inline-flex " +
              focusRing
            }
          >
            {t("logIn")}
          </Link>

          <div className="hidden sm:block">
            <MarketingShellAction
              href="/register"
              className="h-10 rounded-lg bg-indigo-600 px-4 text-[13px] font-semibold text-white shadow-sm shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/35 active:scale-[0.99] motion-reduce:transition-none"
            >
              <span>{t("startTrial")}</span>
              <ArrowRight size={14} aria-hidden="true" className="rtl:rotate-180" />
            </MarketingShellAction>
          </div>

          {/* Mobile hamburger toggle */}
          <button
            ref={mobileMenuRef}
            type="button"
            className={
              "grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 hover:text-indigo-600 xl:hidden " +
              focusRing
            }
            aria-label={mobileOpen ? t("closeNavigation") : t("openNavigation")}
            aria-expanded={mobileOpen}
            aria-controls="fitivo-mobile-navigation"
            onClick={() => setMobileOpen((current) => !current)}
          >
            {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </MarketingContainer>

      {/* Mobile drawer */}
      <nav
        id="fitivo-mobile-navigation"
        hidden={!mobileOpen}
        aria-label={t("mobileNavigation")}
        className="absolute inset-x-0 top-full max-h-[calc(100dvh-120px)] overflow-y-auto border-b border-slate-200 bg-white shadow-xl shadow-slate-900/10 xl:hidden"
      >
        <MarketingContainer className="py-5">
          <div className="flex flex-col gap-1">
            {navigationLinks.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-indigo-600 aria-[current=page]:bg-indigo-50/70 aria-[current=page]:font-semibold aria-[current=page]:text-indigo-600"
                aria-current={pathname === href ? "page" : undefined}
                onClick={closeMenus}
              >
                {t(label)}
              </Link>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2.5 border-t border-slate-200 pt-4">
            <Link
              href="/login"
              className="flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              onClick={closeMenus}
            >
              {t("logIn")}
            </Link>
            <MarketingShellAction
              href="/register"
              className="flex min-h-11 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              onClick={closeMenus}
            >
              <span>{t("startTrial")}</span>
              <ArrowRight size={15} aria-hidden="true" className="rtl:rotate-180" />
            </MarketingShellAction>
          </div>
        </MarketingContainer>
      </nav>
    </header>
  );
}
