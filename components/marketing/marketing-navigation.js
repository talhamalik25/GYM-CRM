"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import MarketingContainer from "./marketing-container.js";
import { MarketingBrand } from "./marketing-primitives.js";
import MarketingShellAction from "./marketing-shell-action.js";


const navigation = [
  { label: "Product", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Product Tour", href: "/demo" },
  { label: "Contact", href: "/contact" },
];

export default function MarketingNavigation() {
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState(null);
  const menuOpen = menuPath === pathname;
  const headerRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") { setMenuPath(null); triggerRef.current?.focus(); }
    };
    const closeOutside = (event) => { if (!headerRef.current?.contains(event.target)) setMenuPath(null); };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) setMenuPath(null); };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutside);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [menuOpen]);

  const links = navigation.map(({ label, href }) => <Link key={href} href={href} className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 aria-[current=page]:text-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" aria-current={pathname === href ? "page" : undefined} onClick={() => setMenuPath(null)}>{label}</Link>);
  return <header className="sticky top-0 z-50 border-b border-slate-200 bg-white font-sans text-slate-900" ref={headerRef} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setMenuPath(null); }}>
    <MarketingContainer className="flex h-[72px] items-center justify-between gap-6">
      <MarketingBrand />
      <nav className="hidden items-center gap-2 lg:flex" aria-label="Main navigation">{links}</nav>
      <div className="hidden items-center gap-3 lg:flex"><MarketingShellAction href="/login" variant="tertiary">Log in</MarketingShellAction><MarketingShellAction href="/free-trial">Request a trial</MarketingShellAction></div>
      <button ref={triggerRef} className="grid size-11 place-items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 lg:hidden" type="button" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} aria-controls="fitivo-mobile-navigation" onClick={() => setMenuPath(menuOpen ? null : pathname)}>{menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}</button>
    </MarketingContainer>
    <nav id="fitivo-mobile-navigation" hidden={!menuOpen} aria-label="Mobile navigation" className="absolute inset-x-0 top-full max-h-[calc(100dvh-72px)] overflow-y-auto border-b border-slate-200 bg-white lg:hidden">
      <MarketingContainer className="py-4"><div className="flex flex-col gap-1">{links}</div><div className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-4"><MarketingShellAction href="/login" variant="tertiary" onClick={() => setMenuPath(null)}>Log in</MarketingShellAction><MarketingShellAction href="/free-trial" onClick={() => setMenuPath(null)}>Request a trial</MarketingShellAction></div></MarketingContainer>
    </nav>
  </header>;
}
