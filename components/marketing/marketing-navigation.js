"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { MarketingBrand, MarketingPrimaryAction } from "./marketing-primitives.js";
import styles from "./marketing.module.css";

const links = [["Features", "features"], ["How it works", "how-it-works"], ["Pricing", "pricing"], ["FAQs", "faq"]];

export default function MarketingNavigation({ trialAvailable }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("");
  const headerRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActive(entry.target.id);
        else setActive((current) => current === entry.target.id ? "" : current);
      }
    }, { rootMargin: "-15% 0px -65% 0px" });
    links.forEach(([, id]) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") { setMenuOpen(false); triggerRef.current?.focus(); }
    };
    const closeOutside = (event) => { if (!headerRef.current?.contains(event.target)) setMenuOpen(false); };
    const desktop = window.matchMedia("(min-width: 900px)");
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutside);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [menuOpen]);

  function navigate(event, id) {
    setMenuOpen(false);
    setActive(id);
    if (event.currentTarget.closest("#fitivo-mobile-navigation")) document.getElementById(id)?.focus({ preventScroll: true });
  }

  return <header className={styles.header} ref={headerRef} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false); }}>
    <a href="#main-content" className={styles.skipLink}>Skip to main content</a>
    <div className={`${styles.container} ${styles.headerInner}`}>
      <MarketingBrand />
      <nav className={styles.desktopNav} aria-label="Main navigation">{links.map(([label, id]) => <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined} onClick={(event) => navigate(event, id)}>{label}</a>)}</nav>
      <div className={styles.desktopActions}><Link href="/login" className={styles.loginLink}>Log in</Link><MarketingPrimaryAction trialAvailable={trialAvailable}>{trialAvailable ? "Start free trial" : "Get started"}</MarketingPrimaryAction></div>
      <div className={styles.mobileActions}><Link href="/login">Log in</Link><button ref={triggerRef} className={styles.menuTrigger} type="button" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} aria-controls="fitivo-mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button></div>
    </div>
    <nav id="fitivo-mobile-navigation" className={styles.mobileNav} hidden={!menuOpen} aria-label="Mobile navigation">{links.map(([label, id]) => <a key={id} href={`#${id}`} onClick={(event) => navigate(event, id)} aria-current={active === id ? "location" : undefined}>{label}</a>)}<MarketingPrimaryAction trialAvailable={trialAvailable} onClick={() => setMenuOpen(false)} /></nav>
  </header>;
}
