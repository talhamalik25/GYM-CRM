"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
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

const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600";
const navLink =
  "inline-flex min-h-11 items-center whitespace-nowrap text-[13px] font-medium text-slate-600! transition-colors hover:text-slate-950! aria-[current=page]:text-indigo-700 motion-reduce:transition-none " +
  focus;

export default function MarketingNavigation() {
  const pathname = usePathname();
  const t = useTranslations("marketing.navigation");
  const headerRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);

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
      className="sticky top-0 z-[70] border-b border-slate-100 bg-white font-sans text-slate-900"
    >
      <MarketingContainer className="flex h-[75px] max-w-[1280px] items-center justify-between gap-3 xl:gap-0">
        <Link
          href="/"
          aria-label="Fitivo home"
          onClick={closeMenus}
          className={"inline-flex min-h-11 w-40 shrink-0 items-center overflow-hidden " + focus}
        >
          <FitivoLogo
            width={200}
            height={66}
            className="-ml-5 rtl:-mr-5 rtl:ml-0 [&_img]:max-w-none"
          />
        </Link>
        <nav
          aria-label="Main navigation"
          className="ml-auto mr-12 rtl:mr-auto rtl:ml-12 hidden items-center gap-6 xl:flex"
        >
          {navigationLinks.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={navLink}
              aria-current={pathname === href ? "page" : undefined}
              onClick={closeMenus}
            >
              {t(label)}
            </Link>
          ))}
        </nav>
        <div className="ml-auto rtl:mr-auto rtl:ml-0 flex items-center justify-end gap-3 xl:gap-4 xl:ml-0 xl:rtl:mr-0">
          <LanguageSwitcher />

          <Link
            href="/login"
            className={
              "hidden min-h-11 w-16 items-center whitespace-nowrap text-[13px] font-medium text-slate-600! transition-colors hover:text-slate-950! motion-reduce:transition-none xl:inline-flex " +
              focus
            }
          >
            {t("logIn")}
          </Link>
          <div className="hidden xl:block">
            <MarketingShellAction
              href="/register"
              className="h-12 w-[157px] rounded-[8px]! bg-primary! px-4! text-[13px]! shadow-sm hover:bg-primary-hover!"
            >
              {t("startTrial")}
              <ArrowRight size={16} aria-hidden="true" className="rtl:rotate-180" />
            </MarketingShellAction>
          </div>
        </div>

        <button
          ref={mobileMenuRef}
          type="button"
          className={
            "grid size-11 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 hover:text-indigo-700 xl:hidden " +
            focus
          }
          aria-label={mobileOpen ? t("closeNavigation") : t("openNavigation")}
          aria-expanded={mobileOpen}
          aria-controls="fitivo-mobile-navigation"
          onClick={() => setMobileOpen((current) => !current)}
        >
          {mobileOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
        </button>
      </MarketingContainer>

      <nav
        id="fitivo-mobile-navigation"
        hidden={!mobileOpen}
        aria-label={t("mobileNavigation")}
        className="absolute inset-x-0 top-full max-h-[calc(100dvh-120px)] overflow-y-auto border-b border-slate-200 bg-white shadow-lg shadow-slate-900/5 xl:hidden"
      >
        <MarketingContainer className="py-5">
          <div className="flex flex-col gap-1">
            {navigationLinks.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className={navLink}
                aria-current={pathname === href ? "page" : undefined}
                onClick={closeMenus}
              >
                {t(label)}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4">
            <Link href="/login" className={navLink} onClick={closeMenus}>
              {t("logIn")}
            </Link>
            <MarketingShellAction href="/register" onClick={closeMenus}>
              {t("startTrial")}
              <ArrowRight size={16} aria-hidden="true" className="rtl:rotate-180" />
            </MarketingShellAction>
          </div>
        </MarketingContainer>
      </nav>
    </header>
  );
}
