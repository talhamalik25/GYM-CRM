'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Activity, CalendarCheck2, ChevronDown, CreditCard, Dumbbell, Menu, Users, X } from 'lucide-react';

const nav = [
  { label: 'Dashboard', href: '/dashboard', Icon: Activity },
  { label: 'Members', href: '/members', Icon: Users },
  { label: 'Plans', href: '/memberships', Icon: Dumbbell },
  { label: 'Payments', href: '/payments', Icon: CreditCard },
  { label: 'Attendance', href: '/attendance', Icon: CalendarCheck2 },
];

function getPageTitle(pathname) {
  if (pathname.startsWith('/memberships')) return 'Plans';
  if (pathname.startsWith('/members')) return 'Members';
  return nav.find(({ href }) => href === pathname)?.label || ({
    '/reports': 'Reports',
    '/settings': 'Settings',
    '/trainers': 'Trainers',
    '/workouts': 'Workouts',
  }[pathname] || 'Dashboard');
}

function SidebarContent({ pathname, onNavigate }) {
  return <>
    <Link href="/dashboard" className="brand" onClick={onNavigate} aria-label="AKTech Gym CRM home">
      <span className="brand-mark" aria-hidden="true"><Activity size={20} strokeWidth={2.6} /></span>
      <span className="brand-copy"><strong>AKTECH</strong><small>DIGITAL SOLUTIONS</small></span>
    </Link>
    <div className="workspace-switcher"><span className="workspace-mark">G</span><span><small>WORKSPACE</small><strong>Gym workspace</strong></span><ChevronDown className="workspace-chevron" size={15} aria-hidden="true" /></div>
    <p className="nav-label">MANAGEMENT</p>
    <nav aria-label="Main navigation" className="side-nav">
      {nav.map(({ label, href, Icon }) => {
        const active = pathname === href || (href === '/members' && pathname.startsWith('/members/')) || (href === '/memberships' && pathname.startsWith('/memberships/'));
        return <Link key={href} href={href} onClick={onNavigate} className={`nav-link${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
          <Icon className="nav-icon" size={18} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span>
        </Link>;
      })}
    </nav>
    <div className="sidebar-bottom">
      <div className="sidebar-note"><span className="sidebar-note-mark">A</span><div><strong>AKTech Digital Solutions</strong><p>Gym management workspace</p></div></div>
      <Link className="profile-button" href="/settings" onClick={onNavigate}><span className="avatar avatar-user">A</span><span className="profile-copy"><strong>Account</strong><small>Administrator</small></span><ChevronDown className="profile-chevron" size={15} aria-hidden="true" /></Link>
    </div>
  </>;
}

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const current = getPageTitle(pathname);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);
  return <div className="app-shell">
    <aside className="sidebar desktop-sidebar"><SidebarContent pathname={pathname} /></aside>
    {menuOpen && <button className="drawer-backdrop" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} />}
    <aside className={`sidebar mobile-sidebar${menuOpen ? ' mobile-sidebar-open' : ''}`} aria-label="Mobile navigation" aria-hidden={!menuOpen}>
      <div className="mobile-sidebar-heading"><span>Navigation</span><button className="drawer-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button></div>
      <SidebarContent pathname={pathname} onNavigate={() => setMenuOpen(false)} />
    </aside>
    <div className="main-column">
      <header className="topbar">
        <div className="topbar-left"><button className="menu-toggle" aria-label="Open navigation menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={21} /></button><div className="topbar-title"><span>Gym CRM</span><strong>{current}</strong></div></div>
        <div className="topbar-actions"><span className="topbar-context">AKTech Digital Solutions</span><span className="topbar-divider" /><Link className="top-account" href="/settings" aria-label="Open account settings"><span className="avatar avatar-user top-avatar">A</span><span className="top-account-label">Account</span><ChevronDown size={15} aria-hidden="true" /></Link></div>
      </header>
      <main className="main-content">{children}</main>
      <footer className="app-footer"><span>AKTech Digital Solutions</span><span>Gym management</span></footer>
    </div>
  </div>;
}
