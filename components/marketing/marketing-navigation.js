"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X, Zap } from "lucide-react";
import { MARKETING_SUPPORT_CHANNEL } from "../../lib/marketingConfig.js";
import { MarketingButton } from "./marketing-primitives.js";

const navigationLinks = [
  ["Features", "#features"],
  ["How it works", "#how-it-works"],
  ["Pricing", "#pricing"],
  ["FAQ", "#faq"],
];

function Brand({ inverse = false }) {
  return <Link href="/" aria-label="Fitivo home" className={`inline-flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight ${inverse ? "text-white" : "text-slate-950"}`}>
    <span className={`grid size-8 place-items-center rounded-[10px] ${inverse ? "bg-white text-indigo-700" : "bg-indigo-600 text-white"}`}><Zap size={18} strokeWidth={2.25} aria-hidden="true" /></span>
    <span>Fitivo</span>
  </Link>;
}

function AccessAction({ trialAvailable, onClick, mobile = false }) {
  if (trialAvailable) return <MarketingButton href="/register" onClick={onClick} className={mobile ? "w-full" : ""}>Start free trial<ArrowRight size={15} aria-hidden="true" /></MarketingButton>;
  if (!MARKETING_SUPPORT_CHANNEL) return null;
  return <a href={MARKETING_SUPPORT_CHANNEL.href} onClick={onClick} target={MARKETING_SUPPORT_CHANNEL.href.startsWith("https:") ? "_blank" : undefined} rel={MARKETING_SUPPORT_CHANNEL.href.startsWith("https:") ? "noreferrer noopener" : undefined} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-950/10 transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${mobile ? "w-full" : ""}`}>
    Request access<ArrowRight size={15} aria-hidden="true" />
  </a>;
}

function MobileHeaderAction({ trialAvailable, scrolled }) {
  const tone = scrolled ? "text-indigo-700" : "text-white";
  if (trialAvailable) return <Link href="/register" className={`rounded-lg px-3 py-2 text-xs font-semibold ${tone}`}>Start free trial</Link>;
  if (!MARKETING_SUPPORT_CHANNEL) return <Link href="/login" className={`rounded-lg px-3 py-2 text-xs font-semibold ${tone}`}>Log in</Link>;
  const external = MARKETING_SUPPORT_CHANNEL.href.startsWith("https:");
  return <a href={MARKETING_SUPPORT_CHANNEL.href} target={external ? "_blank" : undefined} rel={external ? "noreferrer noopener" : undefined} className={`rounded-lg px-3 py-2 text-xs font-semibold ${tone}`}>Request access</a>;
}

export default function MarketingNavigation({ trialAvailable }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 12);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const menu = menuRef.current;
    const focusable = () => [...menu.querySelectorAll("a[href], button:not(:disabled)")];
    focusable()[0]?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return <header className={`sticky top-0 z-50 -mb-[70px] border-b transition-colors duration-200 ${scrolled ? "border-slate-200 bg-white/95 shadow-sm backdrop-blur" : "border-transparent bg-transparent"}`}>
    <a href="#features" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-[60] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-indigo-800 focus:shadow-lg">Skip to main content</a>
    <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
      <Brand inverse={!scrolled} />
      <nav className={`hidden items-center gap-7 text-xs font-medium md:flex ${scrolled ? "text-slate-600" : "text-white/85"}`} aria-label="Main navigation">
        {navigationLinks.map(([label, href]) => <a key={href} href={href} className="transition-colors hover:text-indigo-600">{label}</a>)}
      </nav>
      <div className="hidden items-center gap-4 md:flex">
        <Link href="/login" className={`text-xs font-medium transition-colors hover:text-indigo-600 ${scrolled ? "text-slate-600" : "text-white/90"}`}>Log in</Link>
        {trialAvailable && <AccessAction trialAvailable />}
        {!trialAvailable && MARKETING_SUPPORT_CHANNEL && <AccessAction trialAvailable={false} />}
      </div>
      <div className="flex items-center gap-2 md:hidden">
        <MobileHeaderAction trialAvailable={trialAvailable} scrolled={scrolled} />
        <button ref={triggerRef} type="button" className={`grid size-10 place-items-center rounded-[10px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${scrolled ? "text-slate-800 hover:bg-slate-100" : "text-white hover:bg-white/10"}`} aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} aria-controls="marketing-mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
        </button>
      </div>
    </div>
    <div id="marketing-mobile-navigation" ref={menuRef} aria-hidden={!menuOpen} inert={!menuOpen} className={`absolute inset-x-0 top-full border-t border-slate-200 bg-white px-5 py-3 text-slate-700 shadow-lg transition duration-200 ease-out md:hidden ${menuOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"}`}>
      <nav className="mx-auto grid max-w-7xl gap-1" aria-label="Mobile navigation">
        {navigationLinks.map(([label, href]) => <a key={href} href={href} onClick={closeMenu} className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-600">{label}</a>)}
        <Link href="/login" onClick={closeMenu} className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-600">Log in</Link>
        {trialAvailable && <AccessAction trialAvailable mobile onClick={closeMenu} />}
        {!trialAvailable && MARKETING_SUPPORT_CHANNEL && <AccessAction trialAvailable={false} mobile onClick={closeMenu} />}
      </nav>
    </div>
  </header>;
}
