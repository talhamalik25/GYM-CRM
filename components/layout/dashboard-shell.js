'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Activity, CalendarCheck2, ChartNoAxesColumn, ChevronDown, CreditCard, Dumbbell, Menu, Settings, Users, UserRound } from 'lucide-react';

import Avatar from '../ui/avatar';
import Drawer from '../ui/drawer';

const nav = [
  { label: 'Dashboard', href: '/dashboard', Icon: Activity },
  { label: 'Members', href: '/members', Icon: Users },
  { label: 'Plans', href: '/memberships', Icon: Dumbbell },
  { label: 'Payments', href: '/payments', Icon: CreditCard },
  { label: 'Attendance', href: '/attendance', Icon: CalendarCheck2 },
  { label: 'Trainers', href: '/trainers', Icon: UserRound },
  { label: 'Reports', href: '/reports', Icon: ChartNoAxesColumn },
  { label: 'Settings', href: '/settings', Icon: Settings },
  { label: 'Fitivo plan', href: '/billing', Icon: CreditCard },
  { label: 'Staff', href: '/staff', Icon: Users },
];
const adminNav = [
  { label: 'Platform overview', href: '/admin', Icon: Activity },
  { label: 'Gym accounts', href: '/admin/gyms', Icon: Dumbbell },
  { label: 'User accounts', href: '/admin/users', Icon: Users },
  { label: 'Plans & billing', href: '/admin/billing', Icon: CreditCard },
];
const trainerNav = [{ label: 'Trainer workspace', href: '/trainer', Icon: UserRound }];

function getPageTitle(pathname) {
  if (pathname.startsWith('/memberships')) return 'Plans';
  if (pathname.startsWith('/members')) return 'Members';
  if (pathname.startsWith('/trainers')) return 'Trainers';
  if (pathname.startsWith('/admin/gyms')) return 'Gym accounts';
  if (pathname.startsWith('/admin/users')) return 'User accounts';
  if (pathname.startsWith('/admin/billing')) return 'Plans & billing';
  if (pathname.startsWith('/billing')) return 'Fitivo plan';
  if (pathname.startsWith('/trainer')) return 'Trainer workspace';
  if (pathname === '/profile') return 'Owner profile';
  if (pathname.startsWith('/admin')) return 'Platform overview';
  return nav.find(({ href }) => href === pathname)?.label || ({
    '/reports': 'Reports',
    '/settings': 'Settings',
    '/trainers': 'Trainers',
    '/workouts': 'Workouts',
  '/admin/users': 'User accounts',
    '/admin/gyms': 'Gym accounts',
    '/admin': 'Platform overview',
  }[pathname] || 'Dashboard');
}

function SidebarContent({ pathname, onNavigate, canManageStaff, isSuperadmin, isTrainer }) {
  const links = isSuperadmin ? adminNav : isTrainer ? trainerNav : nav.filter(({ href }) => (href !== '/staff' || canManageStaff) && (href !== '/settings' || canManageStaff) && (href !== '/billing' || canManageStaff));
  return <>
    <Link href={isSuperadmin ? "/admin" : isTrainer ? "/trainer" : "/dashboard"} className="brand" onClick={onNavigate} aria-label="Fitivo home">
      <span className="fitivo-wordmark">Fitivo</span>
    </Link>
    <div className="workspace-switcher"><span className="workspace-mark">{isSuperadmin ? 'F' : 'G'}</span><span><small>{isSuperadmin ? 'PLATFORM' : isTrainer ? 'TRAINER' : 'WORKSPACE'}</small><strong>{isSuperadmin ? 'Fitivo platform' : 'Gym workspace'}</strong></span></div>
    <p className="nav-label">{isSuperadmin ? 'SUPERADMIN' : isTrainer ? 'TRAINER' : 'MANAGEMENT'}</p>
    <nav aria-label="Main navigation" className="side-nav">
      {links.map(({ label, href, Icon }) => {
        const active = pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`));
        return <Link key={href} href={href} onClick={onNavigate} className={`nav-link${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
          <Icon className="nav-icon" size={18} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span>
        </Link>;
      })}
    </nav>
    <div className="sidebar-bottom">
      <div className="sidebar-note"><span className="sidebar-note-mark">F</span><div><strong>Fitivo</strong><p>Gym management workspace</p></div></div>
      <Link className="profile-button" href={isSuperadmin ? "/admin/users" : isTrainer ? "/trainer" : canManageStaff ? "/profile" : "/dashboard"} onClick={onNavigate}><Avatar size="sm" /><span className="profile-copy"><strong>{isTrainer ? "Trainer" : "Account"}</strong><small>Signed in</small></span><ChevronDown className="profile-chevron" size={15} aria-hidden="true" /></Link>
    </div>
  </>;
}

export default function DashboardShell({ children, isSuperadmin = false, canManageStaff = false, isTrainer = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const accountRef = useRef(null);
  const accountTriggerRef = useRef(null);
  const current = getPageTitle(pathname);
  useEffect(() => {
    if (!menuOpen) return;
    const desktop = window.matchMedia('(min-width: 761px)');
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, [menuOpen]);
  useEffect(() => {
    if (!accountMenuOpen) return;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false);
        accountTriggerRef.current?.focus();
      }
    };
    const closeOutside = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('focusin', closeOutside);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('focusin', closeOutside);
    };
  }, [accountMenuOpen]);
  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error();
      setAccountMenuOpen(false);
      router.replace('/login');
      router.refresh();
    } catch {
      setLogoutError('Could not log out. Check your connection and try again.');
      setLoggingOut(false);
    }
  }
  return <div className="app-shell">
    <a href="#main-content" className="shell-skip-link">Skip to content</a>
    <aside className="sidebar desktop-sidebar"><SidebarContent pathname={pathname} canManageStaff={canManageStaff} isSuperadmin={isSuperadmin} isTrainer={isTrainer} /></aside>
    <Drawer open={menuOpen} side="left" onClose={() => setMenuOpen(false)} title="Navigation" className="shell-navigation-drawer">
      <div className="shell-drawer-content">
        <SidebarContent pathname={pathname} canManageStaff={canManageStaff} isSuperadmin={isSuperadmin} isTrainer={isTrainer} onNavigate={() => setMenuOpen(false)} />
      </div>
    </Drawer>
    <div className="main-column">
      <header className="topbar">
        <div className="topbar-left"><button className="menu-toggle" aria-label="Open navigation menu" aria-expanded={menuOpen} onClick={() => { setAccountMenuOpen(false); setMenuOpen(true); }}><Menu size={21} /></button><div className="topbar-title"><span>Fitivo</span><strong>{current}</strong></div></div>
        <div className="topbar-actions"><span className="topbar-context">Fitivo</span><span className="topbar-divider" /><div className="relative" ref={accountRef}>
          <button type="button" className="top-account border-0 bg-transparent p-0" ref={accountTriggerRef} aria-label="Account options" aria-controls={accountMenuOpen ? "account-options" : undefined} aria-expanded={accountMenuOpen} onClick={() => setAccountMenuOpen((open) => !open)}><Avatar size="sm" /><span className="top-account-label">Account</span><ChevronDown size={15} aria-hidden="true" /></button>
          {accountMenuOpen && <div className="absolute right-0 top-full z-50 mt-3 w-48 rounded-xl border border-line bg-white p-1.5 shadow-lg" id="account-options" aria-label="Account options">
            {logoutError && <p className="px-3 py-2 text-xs text-error" role="alert">{logoutError}</p>}
            {!isSuperadmin && !isTrainer && canManageStaff && <Link className="block rounded-lg px-3 py-2.5 text-sm text-ink hover:bg-canvas" href="/profile" onClick={() => setAccountMenuOpen(false)}>Owner profile</Link>}
    {isSuperadmin && <>
              <Link className="block rounded-lg px-3 py-2.5 text-sm text-ink hover:bg-canvas" href="/admin" onClick={() => setAccountMenuOpen(false)}>Platform overview</Link>
              <Link className="block rounded-lg px-3 py-2.5 text-sm text-ink hover:bg-canvas" href="/admin/gyms" onClick={() => setAccountMenuOpen(false)}>Gym accounts</Link>
              <Link className="block rounded-lg px-3 py-2.5 text-sm text-ink hover:bg-canvas" href="/admin/users" onClick={() => setAccountMenuOpen(false)}>User accounts</Link>
              <Link className="block rounded-lg px-3 py-2.5 text-sm text-ink hover:bg-canvas" href="/admin/billing" onClick={() => setAccountMenuOpen(false)}>Plans &amp; billing</Link>
            </>}
            <button type="button" className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink hover:bg-canvas" disabled={loggingOut} aria-busy={loggingOut} onClick={handleLogout}>{loggingOut ? "Logging out…" : "Log out"}</button>
          </div>}
        </div></div>
      </header>
      <main id="main-content" tabIndex={-1} className="main-content">{children}</main>
      <footer className="app-footer"><span>Fitivo</span><span>Gym management</span></footer>
    </div>
  </div>;
}
