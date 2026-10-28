"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { SITE } from "../../lib/marketing/site.js";
import { MarketingBrand } from "./marketing-primitives.js";
import styles from "./marketing-shell.module.css";

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

  return <header className={styles.header} ref={headerRef} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setMenuPath(null); }}>
    <div className={`${styles.container} ${styles.headerInner}`}>
      <MarketingBrand />
      <nav className={styles.desktopNav} aria-label="Main navigation">{links}</nav>
      <div className={styles.desktopActions}>
        <span className={styles.region} aria-label="Region: Pakistan">{SITE.region}</span>
        <Link href="/login" className={styles.login}>Portal login</Link>
        <Link href="/free-trial" className={styles.primary}>Start Free Trial <ArrowUpRight size={15} aria-hidden="true" /></Link>
      </div>
      <div className={styles.mobileActions}>
        <span className={styles.region} aria-label="Region: Pakistan">{SITE.region}</span>
        <Link href="/login" className={styles.login}>Portal login</Link>
        <button ref={triggerRef} className={styles.menuTrigger} type="button" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} aria-controls="fitivo-mobile-navigation" onClick={() => setMenuPath(menuOpen ? null : pathname)}>{menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}</button>
      </div>
    </div>
    <nav id="fitivo-mobile-navigation" className={styles.mobileNav} hidden={!menuOpen} aria-label="Mobile navigation">{links}<Link href="/free-trial" className={styles.primary} onClick={() => setMenuPath(null)}>Start Free Trial <ArrowUpRight size={15} aria-hidden="true" /></Link></nav>
  </header>;
}
