"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, Menu, X, Users, CreditCard, CalendarCheck2, Dumbbell, ChartNoAxesColumn, UserRound, Sparkles } from "lucide-react";
import MarketingContainer from "./marketing-container.js";
import FitivoLogo from "../brand/fitivo-logo.js";
import MarketingShellAction from "./marketing-shell-action.js";

const products = [
  { title: "Members", href: "/features#member-management", Icon: Users, description: "Member records and membership context." },
  { title: "Memberships", href: "/features#memberships", Icon: Dumbbell, description: "Plans, expiry dates and renewals." },
  { title: "Payments", href: "/features#fees", Icon: CreditCard, description: "Recorded payments, dues and receipts." },
  { title: "Attendance", href: "/features#attendance", Icon: CalendarCheck2, description: "Check-ins, check-outs and visit history." },
  { title: "Reports", href: "/features#reports", Icon: ChartNoAxesColumn, description: "Review collections and attendance." },
  { title: "Staff & Trainers", href: "/features#trainers", Icon: UserRound, description: "Team access and assigned members." },
];
const navigation = [{ label: "Features", href: "/features" }, { label: "Pricing", href: "/pricing" }, { label: "Product Tour", href: "/demo" }];
const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600";
const navLink = "flex min-h-11 items-center rounded-full px-3.5 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-indigo-700 aria-[current=page]:bg-indigo-50 aria-[current=page]:text-indigo-700 motion-reduce:transition-none " + focus;

export default function MarketingNavigation() {
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState(null);
  const [productPath, setProductPath] = useState(null);
  const menuOpen = menuPath === pathname;
  const productOpen = productPath === pathname;
  const headerRef = useRef(null);
  const menuTrigger = useRef(null);
  const productTrigger = useRef(null);

  function closeMenus() { setMenuPath(null); setProductPath(null); }

  useEffect(() => {
    if (!menuOpen && !productOpen) return;
    function onEscape(event) {
      if (event.key !== "Escape") return;
      setMenuPath(null); setProductPath(null);
      (menuOpen ? menuTrigger : productTrigger).current?.focus();
    }
    function onOutside(event) {
      if (!headerRef.current?.contains(event.target)) { setMenuPath(null); setProductPath(null); }
    }
    const desktop = window.matchMedia("(min-width: 1280px)");
    function onBreakpoint() { setMenuPath(null); setProductPath(null); }
    document.addEventListener("keydown", onEscape);
    document.addEventListener("pointerdown", onOutside);
    desktop.addEventListener("change", onBreakpoint);
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.removeEventListener("pointerdown", onOutside);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [menuOpen, productOpen]);

  function productLinks(mobile = false) {
    return products.map(({ title, href, Icon, description }) => (
      <Link key={href} href={href} onClick={closeMenus}
        className={"group flex min-h-11 items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/60 hover:shadow-[0_18px_36px_-24px_rgba(79,70,229,0.45)] " + focus}>
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"><Icon size={18} strokeWidth={1.7} aria-hidden="true" /></span>
        <span>
          <span className="block text-sm font-semibold text-slate-900 group-hover:text-indigo-700">{title}</span>
          {!mobile && <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>}
        </span>
      </Link>
    ));
  }

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-[70] border-b border-slate-200/80 bg-white/90 font-sans text-slate-900 backdrop-blur-xl shadow-[0_18px_35px_-28px_rgba(15,23,42,0.18)]"
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) closeMenus(); }}
    >
      <div className="border-b border-indigo-100 bg-[radial-gradient(circle_at_left,_rgba(79,70,229,0.18),transparent_35%),linear-gradient(90deg,#f5f3ff_0%,#eff6ff_38%,#ffffff_100%)]">
        <MarketingContainer className="flex items-center justify-between gap-3 py-2.5 text-[11px] font-semibold tracking-[0.18em] text-slate-700 uppercase xl:justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-2.5 py-1 text-[10px] text-indigo-700 shadow-sm shadow-indigo-100">
            <Sparkles size={12} aria-hidden="true" />
            7-day free trial
          </span>
          <span className="hidden text-slate-600 sm:inline">No credit card required</span>
        </MarketingContainer>
      </div>

      <MarketingContainer className="flex h-[72px] items-center justify-between xl:grid xl:h-[76px] xl:grid-cols-[1fr_auto_1fr] xl:gap-8">
        <Link href="/" aria-label="Fitivo home" onClick={closeMenus} className={"inline-flex min-h-11 w-fit items-center " + focus}><FitivoLogo width={156} height={52} /></Link>

        <nav aria-label="Main navigation" className="hidden items-center justify-center gap-2 xl:flex">
          <div className="relative">
            <button
              ref={productTrigger}
              type="button"
              className={navLink + " gap-1.5"}
              aria-expanded={productOpen}
              aria-controls="fitivo-product-menu"
              onClick={() => setProductPath(productOpen ? null : pathname)}
            >
              Product
              <ChevronDown size={14} aria-hidden="true" className={productOpen ? "rotate-180" : ""} />
            </button>
            <div id="fitivo-product-menu" hidden={!productOpen} className="absolute left-1/2 top-[calc(100%+18px)] w-[560px] -translate-x-1/2 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_28px_60px_-35px_rgba(15,23,42,0.38)] ring-1 ring-slate-100">
              <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Your gym, connected</div>
              <div className="grid grid-cols-2 gap-2 p-3">{productLinks()}</div>
              <Link href="/features" onClick={closeMenus} className={"flex min-h-12 items-center justify-between border-t border-slate-200 bg-gradient-to-r from-indigo-50 to-white px-5 text-sm font-semibold text-indigo-700 transition-colors hover:text-indigo-800 " + focus}>
                Explore all features
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>

          {navigation.map(({ label, href }) => (
            <Link key={href} href={href} className={navLink} aria-current={pathname === href ? "page" : undefined} onClick={closeMenus}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center justify-end gap-3 xl:flex">
          <Link href="/contact" className={"inline-flex min-h-11 items-center rounded-full px-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 transition-colors hover:text-indigo-700 " + focus}>Contact</Link>
          <Link href="/login" className={"inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-indigo-700 " + focus}>Log in</Link>
          <MarketingShellAction href="/free-trial" className="shadow-[0_18px_38px_-20px_rgba(79,70,229,0.75)]">Request a trial<ArrowRight size={16} aria-hidden="true" /></MarketingShellAction>
        </div>

        <button
          ref={menuTrigger}
          type="button"
          className={"grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-indigo-700 xl:hidden " + focus}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="fitivo-mobile-navigation"
          onClick={() => { setMenuPath(menuOpen ? null : pathname); setProductPath(null); }}
        >
          {menuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
        </button>
      </MarketingContainer>

      <nav id="fitivo-mobile-navigation" hidden={!menuOpen} aria-label="Mobile navigation" className="absolute inset-x-0 top-full max-h-[calc(100dvh-108px)] overflow-y-auto overscroll-contain border-b border-slate-200 bg-white shadow-lg shadow-slate-900/5 xl:hidden">
        <MarketingContainer className="py-5">
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50/80 px-3 py-2">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700"><Sparkles size={12} aria-hidden="true" />7-day trial</span>
            <span className="text-xs text-slate-600">No card needed</span>
          </div>
          <button type="button" className={"flex min-h-12 w-full items-center justify-between rounded-full px-3 text-sm font-semibold text-slate-700 " + focus} aria-expanded={productOpen} aria-controls="fitivo-mobile-product" onClick={() => setProductPath(productOpen ? null : pathname)}>
            Product
            <ChevronDown size={16} aria-hidden="true" className={productOpen ? "rotate-180" : ""} />
          </button>
          <div id="fitivo-mobile-product" hidden={!productOpen} className="mb-3 border-l border-slate-200 pl-2">{productLinks(true)}</div>
          {[...navigation, { label: "Contact", href: "/contact" }].map(({ label, href }) => (
            <Link key={href} href={href} className={navLink + " mt-1 w-full justify-between"} aria-current={pathname === href ? "page" : undefined} onClick={closeMenus}>
              {label}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4">
            <MarketingShellAction href="/login" variant="tertiary" onClick={closeMenus}>Log in</MarketingShellAction>
            <MarketingShellAction href="/free-trial" onClick={closeMenus}>Request a trial<ArrowRight size={16} aria-hidden="true" /></MarketingShellAction>
          </div>
        </MarketingContainer>
      </nav>
    </header>
  );
}
