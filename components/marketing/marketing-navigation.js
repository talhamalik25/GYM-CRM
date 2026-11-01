"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { SITE } from "../../config/site.js";
import { MarketingBrand } from "./marketing-primitives.js";
import MarketingShellAction from "./marketing-shell-action.js";


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
    const desktop = window.matchMedia("(min-width: 1100px)");
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

  const links = SITE.navigation.map(({ label, href }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setMenuPath(null)}>{label}</Link>);

  return <header className={"m-marketing-shell-header exact:sticky exact:[top:0] exact:[z-index:50] exact:[background:rgb(255_255_255_/_97%)] exact:[backdrop-filter:blur(16px)] exact:[border-bottom:1px_solid_var(--shell-line)]"} ref={headerRef} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setMenuPath(null); }}>
    <div className={`${"m-marketing-shell-container exact:[width:min(1184px,_calc(100%_-_64px))] exact:[margin-inline:auto] exact:at-most-639:[width:calc(100%_-_40px)]"} ${"m-marketing-shell-headerInner exact:flex exact:items-center exact:[justify-content:space-between] exact:[gap:22px] exact:[min-height:84px] exact:at-most-639:[min-height:72px] exact:at-most-639:[gap:12px]"}`}>
      <MarketingBrand />
      <nav className={"m-marketing-shell-desktopNav exact:flex exact:items-center exact:[gap:21px] exact:[font-size:13px] exact:[color:var(--shell-muted)] exact:[&_a]:relative exact:[&_a]:[padding-block:29px] exact:[&_a]:[white-space:nowrap] exact:[&_a:hover]:[color:var(--shell-brand)] exact:[&_a[aria-current]]:[color:var(--shell-brand)] exact:[&_a[aria-current]::after]:[content:''] exact:[&_a[aria-current]::after]:absolute exact:[&_a[aria-current]::after]:[bottom:19px] exact:[&_a[aria-current]::after]:[left:0] exact:[&_a[aria-current]::after]:[right:0] exact:[&_a[aria-current]::after]:[height:2px] exact:[&_a[aria-current]::after]:[background:currentColor] exact:at-most-1099:hidden"} aria-label="Main navigation">{links}</nav>
      <div className={"m-marketing-shell-desktopActions exact:flex exact:items-center exact:[gap:16px] exact:at-most-1099:hidden"}>
        <span className={"m-marketing-shell-region exact:inline-flex exact:items-center exact:justify-center exact:[min-width:29px] exact:[height:24px] exact:[border:1px_solid_var(--shell-line)] exact:[border-radius:5px] exact:[background:#fafafd] exact:[font-size:10px] exact:[font-weight:600] exact:[letter-spacing:.04em] exact:[color:var(--shell-muted)]"} aria-label="Region: Pakistan">{SITE.region}</span>
        <Link href="/login" className={"m-marketing-shell-login exact:[&:hover]:[color:var(--shell-brand)] exact:inline-flex exact:items-center exact:[min-height:44px] exact:[font-size:12px] exact:[font-weight:600] exact:[white-space:nowrap]"}>Portal login</Link>
        <MarketingShellAction href="/free-trial" className={""}>Start Free Trial <ArrowUpRight size={15} aria-hidden="true" /></MarketingShellAction>
      </div>
      <div className={"m-marketing-shell-mobileActions exact:hidden exact:at-most-1099:flex exact:at-most-1099:items-center exact:at-most-1099:[gap:16px] exact:at-most-639:[gap:10px] exact:at-most-639:[&_.m-marketing-shell-region]:hidden"}>
        <span className={"m-marketing-shell-region exact:inline-flex exact:items-center exact:justify-center exact:[min-width:29px] exact:[height:24px] exact:[border:1px_solid_var(--shell-line)] exact:[border-radius:5px] exact:[background:#fafafd] exact:[font-size:10px] exact:[font-weight:600] exact:[letter-spacing:.04em] exact:[color:var(--shell-muted)]"} aria-label="Region: Pakistan">{SITE.region}</span>
        <Link href="/login" className={"m-marketing-shell-login exact:[&:hover]:[color:var(--shell-brand)] exact:inline-flex exact:items-center exact:[min-height:44px] exact:[font-size:12px] exact:[font-weight:600] exact:[white-space:nowrap]"}>Portal login</Link>
        <button ref={triggerRef} className={"m-marketing-shell-menuTrigger exact:at-most-1099:grid exact:at-most-1099:[place-items:center] exact:at-most-1099:[width:44px] exact:at-most-1099:[height:44px] exact:at-most-1099:[border:1px_solid_var(--shell-line)] exact:at-most-1099:[border-radius:9px] exact:at-most-1099:[background:white] exact:at-most-1099:[color:var(--shell-ink)] exact:at-most-1099:cursor-pointer"} type="button" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} aria-controls="fitivo-mobile-navigation" onClick={() => setMenuPath(menuOpen ? null : pathname)}>{menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}</button>
      </div>
    </div>
    <nav id="fitivo-mobile-navigation" className={"m-marketing-shell-mobileNav exact:hidden exact:at-most-1099:[&:not([hidden])]:flex exact:at-most-1099:[&:not([hidden])]:flex-col exact:at-most-1099:[&:not([hidden])]:absolute exact:at-most-1099:[&:not([hidden])]:[inset:100%_0_auto] exact:at-most-1099:[&:not([hidden])]:[padding:16px_32px_24px] exact:at-most-1099:[&:not([hidden])]:[max-height:calc(100dvh_-_84px)] exact:at-most-1099:[&:not([hidden])]:[overflow-y:auto] exact:at-most-1099:[&:not([hidden])]:[background:white] exact:at-most-1099:[&:not([hidden])]:[border-bottom:1px_solid_var(--shell-line)] exact:at-most-1099:[&:not([hidden])]:[box-shadow:0_20px_30px_#161b2e0a] exact:at-most-1099:[&>a:not(.m-marketing-shell-primary)]:[padding:12px_4px] exact:at-most-1099:[&>a:not(.m-marketing-shell-primary)]:[color:var(--shell-muted)] exact:at-most-1099:[&>a:not(.m-marketing-shell-primary)]:[font-size:14px] exact:at-most-1099:[&>a[aria-current]]:[color:var(--shell-brand)] exact:at-most-1099:[&>a[aria-current]]:[font-weight:600] exact:at-most-1099:[&_.m-marketing-shell-primary]:[margin-top:12px] exact:at-most-639:[&:not([hidden])]:[padding-inline:20px] exact:at-most-639:[&:not([hidden])]:[max-height:calc(100dvh_-_72px)]"} hidden={!menuOpen} aria-label="Mobile navigation">{links}<MarketingShellAction href="/free-trial" className={""} onClick={() => setMenuPath(null)}>Start Free Trial <ArrowUpRight size={15} aria-hidden="true" /></MarketingShellAction></nav>
  </header>;
}
