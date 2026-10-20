'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Activity, CalendarCheck2, ChartNoAxesColumn, ChevronDown, CreditCard, Dumbbell, Menu, Settings, Users, UserRound, X } from 'lucide-react';

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

function getPageTitle(pathname) {
  if (pathname.startsWith('/memberships')) return 'Plans';
  if (pathname.startsWith('/members')) return 'Members';
  if (pathname.startsWith('/trainers')) return 'Trainers';
  if (pathname.startsWith('/admin/gyms')) return 'Gym accounts';
  if (pathname.startsWith('/admin/users')) return 'User accounts';
  if (pathname.startsWith('/admin/billing')) return 'Plans & billing';
  if (pathname.startsWith('/billing')) return 'Fitivo plan';
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

function SidebarContent({ pathname, onNavigate, canManageStaff, isSuperadmin }) {
  const links = isSuperadmin ? adminNav : nav.filter(({ href }) => (href !== '/staff' || canManageStaff) && (href !== '/settings' || canManageStaff) && (href !== '/billing' || canManageStaff));
  return <>
    <Link href="/dashboard" className="brand" onClick={onNavigate} aria-label="Fitivo home">
      <span className="fitivo-wordmark">Fitivo</span>
    </Link>
    <div className="workspace-switcher"><span className="workspace-mark">{isSuperadmin ? 'F' : 'G'}</span><span><small>{isSuperadmin ? 'PLATFORM' : 'WORKSPACE'}</small><strong>{isSuperadmin ? 'Fitivo platform' : 'Gym workspace'}</strong></span>{!isSuperadmin && <ChevronDown className="workspace-chevron" size={15} aria-hidden="true" />}</div>
    <p className="nav-label">{isSuperadmin ? 'SUPERADMIN' : 'MANAGEMENT'}</p>
    <nav aria-label="Main navigation" className="side-nav">
      {links.map(({ label, href, Icon }) => {
        const active = pathname === href || (href !== '/admin' && isSuperadmin && pathname.startsWith(`${href}/`)) || (!isSuperadmin && ((href === '/members' && pathname.startsWith('/members/')) || (href === '/memberships' && pathname.startsWith('/memberships/'))));
        return <Link key={href} href={href} onClick={onNavigate} className={`nav-link${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
          <Icon className="nav-icon" size={18} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span>
        </Link>;
      })}
    </nav>
    <div className="sidebar-bottom">
      <div className="sidebar-note"><span className="sidebar-note-mark">F</span><div><strong>Fitivo</strong><p>Gym management workspace</p></div></div>
      <Link className="profile-button" href={isSuperadmin ? "/admin/users" : "/settings"} onClick={onNavigate}><span className="avatar avatar-user">A</span><span className="profile-copy"><strong>Account</strong><small>Signed in</small></span><ChevronDown className="profile-chevron" size={15} aria-hidden="true" /></Link>
    </div>
  </>;
}

export default function DashboardShell({ children, isSuperadmin = false, canManageStaff = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const current = getPageTitle(pathname);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);
  useEffect(() => {
    if (!accountMenuOpen) return;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setAccountMenuOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [accountMenuOpen]);
  async function handleLogout() {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error();
      setAccountMenuOpen(false);
      router.replace('/login');
      router.refresh();
    } catch {
      setLogoutError('Could not log out. Check your connection and try again.');
    }
  }
  return <div className="app-shell">
    <aside className="sidebar desktop-sidebar"><SidebarContent pathname={pathname} canManageStaff={canManageStaff} isSuperadmin={isSuperadmin} /></aside>
    {menuOpen && <button className="drawer-backdrop" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} />}
    <aside className={`sidebar mobile-sidebar${menuOpen ? ' mobile-sidebar-open' : ''}`} aria-label="Mobile navigation" aria-hidden={!menuOpen}>
      <div className="mobile-sidebar-heading"><span>Navigation</span><button className="drawer-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button></div>
      <SidebarContent pathname={pathname} canManageStaff={canManageStaff} isSuperadmin={isSuperadmin} onNavigate={() => setMenuOpen(false)} />
    </aside>
    <div className="main-column">
      <header className="topbar">
        <div className="topbar-left"><button className="menu-toggle" aria-label="Open navigation menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={21} /></button><div className="topbar-title"><span>Fitivo</span><strong>{current}</strong></div></div>
        <div className="topbar-actions"><span className="topbar-context">Fitivo</span><span className="topbar-divider" /><div className="relative">
          <button type="button" className="top-account border-0 bg-transparent p-0" aria-label="Open account menu" aria-haspopup="menu" aria-expanded={accountMenuOpen} onClick={() => setAccountMenuOpen((open) => !open)}><span className="avatar avatar-user top-avatar">A</span><span className="top-account-label">Account</span><ChevronDown size={15} aria-hidden="true" /></button>
          {accountMenuOpen && <div className="absolute right-0 top-full z-50 mt-3 w-48 rounded-xl border border-line bg-white p-1.5 shadow-lg" role="menu" aria-label="Account menu">
            {logoutError && <p className="px-3 py-2 text-xs text-error" role="alert">{logoutError}</p>}
            {!isSuperadmin && <Link className="block rounded-lg px-3 py-2.5 text-sm text-ink hover:bg-canvas" href="/settings" role="menuitem" onClick={() => setAccountMenuOpen(false)}>Account settings</Link>}
    {isSuperadmin && <>
              <Link className="block rounded-lg px-3 py-2.5 text-sm text-ink hover:bg-canvas" href="/admin" role="menuitem" onClick={() => setAccountMenuOpen(false)}>Platform overview</Link>
              <Link className="block rounded-lg px-3 py-2.5 text-sm text-ink hover:bg-canvas" href="/admin/gyms" role="menuitem" onClick={() => setAccountMenuOpen(false)}>Gym accounts</Link>
              <Link className="block rounded-lg px-3 py-2.5 text-sm text-ink hover:bg-canvas" href="/admin/users" role="menuitem" onClick={() => setAccountMenuOpen(false)}>User accounts</Link>
              <Link className="block rounded-lg px-3 py-2.5 text-sm text-ink hover:bg-canvas" href="/admin/billing" role="menuitem" onClick={() => setAccountMenuOpen(false)}>Plans &amp; billing</Link>
            </>}
            <button type="button" className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink hover:bg-canvas" role="menuitem" onClick={handleLogout}>Log out</button>
          </div>}
        </div></div>
      </header>
      <main className="main-content">{children}</main>
      <footer className="app-footer"><span>Fitivo</span><span>Gym management</span></footer>
    </div>
  </div>;
}
