"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, Menu, X, Users, CreditCard, CalendarCheck2, Dumbbell, ChartNoAxesColumn, UserRound } from "lucide-react";
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
const navLink = "flex min-h-11 items-center border-b-2 border-transparent text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-600 hover:text-indigo-600 aria-[current=page]:border-indigo-600 aria-[current=page]:text-indigo-600 motion-reduce:transition-none " + focus;

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
    return products.map(({ title, href, Icon, description }) => <Link key={href} href={href} onClick={closeMenus}
      className={"group flex min-h-11 items-start gap-3 rounded-lg p-3 hover:bg-slate-50 " + focus}>
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600"><Icon size={18} strokeWidth={1.7} aria-hidden="true" /></span>
      <span><span className="block text-sm font-semibold text-slate-900 group-hover:text-indigo-600">{title}</span>{!mobile && <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>}</span>
    </Link>);
  }

  return <header ref={headerRef} className="sticky top-0 z-[70] border-b border-slate-200 bg-white font-sans text-slate-900 shadow-[0_2px_8px_-6px_rgba(15,23,42,0.18)]"
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) closeMenus(); }}>
    <MarketingContainer className="flex h-[72px] items-center justify-between xl:grid xl:h-[76px] xl:grid-cols-[1fr_auto_1fr] xl:gap-8">
      <Link href="/" aria-label="Fitivo home" onClick={closeMenus} className={"inline-flex min-h-11 w-fit items-center " + focus}><FitivoLogo width={156} height={52} /></Link>
      <nav aria-label="Main navigation" className="hidden items-center gap-7 xl:flex">
        <div className="relative">
          <button ref={productTrigger} type="button" className={navLink + " gap-1.5"} aria-expanded={productOpen} aria-controls="fitivo-product-menu" onClick={() => setProductPath(productOpen ? null : pathname)}>Product<ChevronDown size={14} aria-hidden="true" className={productOpen ? "rotate-180" : ""} /></button>
          <div id="fitivo-product-menu" hidden={!productOpen} className="absolute left-1/2 top-[calc(100%+16px)] w-[560px] -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
            <div className="px-5 pt-5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Your gym, connected</div>
            <div className="grid grid-cols-2 gap-1 p-2">{productLinks()}</div>
            <Link href="/features" onClick={closeMenus} className={"flex min-h-12 items-center justify-between border-t border-slate-200 bg-slate-50 px-5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 " + focus}>Explore all features<ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </div>
        {navigation.map(({label, href}) => <Link key={href} href={href} className={navLink} aria-current={pathname === href ? "page" : undefined} onClick={closeMenus}>{label}</Link>)}
      </nav>
      <div className="hidden items-center justify-end gap-5 xl:flex">
        <Link href="/contact" className={"inline-flex min-h-11 items-center text-xs font-medium text-slate-500 hover:text-indigo-600 " + focus}>Contact</Link>
        <Link href="/login" className={"inline-flex min-h-11 items-center whitespace-nowrap text-sm font-semibold text-slate-700 hover:text-indigo-600 " + focus}>Log in</Link>
        <MarketingShellAction href="/free-trial">Request a trial<ArrowRight size={16} aria-hidden="true" /></MarketingShellAction>
      </div>
      <button ref={menuTrigger} type="button" className={"grid size-11 place-items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 xl:hidden " + focus} aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} aria-controls="fitivo-mobile-navigation" onClick={() => { setMenuPath(menuOpen ? null : pathname); setProductPath(null); }}>{menuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}</button>
    </MarketingContainer>
    <nav id="fitivo-mobile-navigation" hidden={!menuOpen} aria-label="Mobile navigation" className="absolute inset-x-0 top-full max-h-[calc(100dvh-108px)] overflow-y-auto overscroll-contain border-b border-slate-200 bg-white shadow-lg shadow-slate-900/5 xl:hidden">
      <MarketingContainer className="py-5">
        <button type="button" className={"flex min-h-12 w-full items-center justify-between text-sm font-semibold " + focus} aria-expanded={productOpen} aria-controls="fitivo-mobile-product" onClick={() => setProductPath(productOpen ? null : pathname)}>Product<ChevronDown size={16} aria-hidden="true" className={productOpen ? "rotate-180" : ""} /></button>
        <div id="fitivo-mobile-product" hidden={!productOpen} className="mb-3 border-l border-slate-200 pl-2">{productLinks(true)}</div>
        {[...navigation, {label:"Contact",href:"/contact"}].map(({label,href}) => <Link key={href} href={href} className={navLink} aria-current={pathname === href ? "page" : undefined} onClick={closeMenus}>{label}</Link>)}
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4"><MarketingShellAction href="/login" variant="tertiary" onClick={closeMenus}>Log in</MarketingShellAction><MarketingShellAction href="/free-trial" onClick={closeMenus}>Request a trial<ArrowRight size={16} aria-hidden="true" /></MarketingShellAction></div>
      </MarketingContainer>
    </nav>
  </header>;
}
