'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Activity, CalendarCheck2, ChartNoAxesColumn, CreditCard, Dumbbell, LogOut, Menu, Settings, Users, UserRound, Zap } from 'lucide-react';

import BranchSwitcher from '../branches/branch-switcher';
import Avatar from '../ui/avatar';
import Button from '../ui/button';
import Drawer from '../ui/drawer';
import Dropdown from '../ui/dropdown';

const nav = [
  { label: 'Dashboard', href: '/dashboard', Icon: Activity, group: 'Overview' },
  { label: 'Members', href: '/members', Icon: Users, group: 'Management' },
  { label: 'Plans', href: '/memberships', Icon: Dumbbell, group: 'Management' },
  { label: 'Attendance', href: '/attendance', Icon: CalendarCheck2, group: 'Management' },
  { label: 'Trainers', href: '/trainers', Icon: UserRound, group: 'Management' },
  { label: 'Staff', href: '/staff', Icon: Users, group: 'Management', ownerOnly: true },
  { label: 'Payments', href: '/payments', Icon: CreditCard, group: 'Finance' },
  { label: 'Reports', href: '/reports', Icon: ChartNoAxesColumn, group: 'Finance' },
  { label: 'Fitivo plan', href: '/billing', Icon: CreditCard, group: 'Finance', ownerOnly: true },
  { label: 'Settings', href: '/settings', Icon: Settings, group: 'Workspace', ownerOnly: true },
];
const adminNav = [
  { label: 'Platform overview', href: '/admin', Icon: Activity, group: 'Overview' },
  { label: 'Gym accounts', href: '/admin/gyms', Icon: Dumbbell, group: 'Management' },
  { label: 'User accounts', href: '/admin/users', Icon: Users, group: 'Management' },
  { label: 'Plans & billing', href: '/admin/billing', Icon: CreditCard, group: 'Finance' },
];
const trainerNav = [{ label: 'Trainer workspace', href: '/trainer', Icon: UserRound, group: 'Overview' }];

function isActive(pathname, href) {
  return pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`));
}

function getPageTitle(pathname) {
  if (pathname === '/profile') return 'Owner profile';
  if (pathname === '/workouts') return 'Workouts';
  return [...nav, ...adminNav, ...trainerNav].find(({ href }) => isActive(pathname, href))?.label || 'Dashboard';
}

function SidebarContent({ pathname, links, homeHref, roleName, accountEmail, profileHref, onNavigate, onLogout, loggingOut, logoutError }) {
  const groups = [...new Set(links.map(({ group }) => group))];
  return <>
    <Link href={homeHref} className="brand" onClick={onNavigate} aria-label="Fitivo home">
      <span className="brand-mark"><Zap size={22} strokeWidth={1.75} aria-hidden="true" /></span>
      <span className="brand-copy"><span className="fitivo-wordmark">Fitivo</span><span className="workspace-caption">{roleName} workspace</span></span>
    </Link>
    <nav aria-label="Main navigation" className="side-nav">
      {groups.map((group) => <div className="nav-group" key={group}>
        <p className="nav-label">{group}</p>
        <ul className="nav-items">
          {links.filter((link) => link.group === group).map(({ label, href, Icon }) => {
            const active = isActive(pathname, href);
            return <li key={href}><Link href={href} onClick={onNavigate} className={`nav-link${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
              <Icon className="nav-icon" size={18} strokeWidth={1.75} aria-hidden="true" /><span>{label}</span>
            </Link></li>;
          })}
        </ul>
      </div>)}
    </nav>
    <div className="sidebar-bottom">
      <div className="shell-account-card">
        <Link className="profile-button" href={profileHref} onClick={onNavigate}>
          <Avatar name={accountEmail} size="sm" />
          <span className="profile-copy"><strong>{roleName}</strong><small title={accountEmail || undefined}>{accountEmail || 'Signed in'}</small></span>
        </Link>
        <Button type="button" variant="ghost" className="shell-signout" onClick={onLogout} loading={loggingOut} loadingLabel="Signing out…"><LogOut size={16} strokeWidth={1.75} aria-hidden="true" />Sign out</Button>
        {logoutError && <p className="shell-account-error" role="alert">{logoutError}</p>}
      </div>
    </div>
  </>;
}

export default function DashboardShell({ children, isSuperadmin = false, canManageStaff = false, isTrainer = false, accountEmail = '' }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const roleName = isSuperadmin ? 'Super Admin' : isTrainer ? 'Trainer' : canManageStaff ? 'Gym Owner' : 'Staff';
  const homeHref = isSuperadmin ? '/admin' : isTrainer ? '/trainer' : '/dashboard';
  const profileHref = isSuperadmin ? '/admin/users' : isTrainer ? '/trainer' : canManageStaff ? '/profile' : '/dashboard';
  const links = isSuperadmin ? adminNav : isTrainer ? trainerNav : nav.filter(({ ownerOnly }) => !ownerOnly || canManageStaff);

  useEffect(() => {
    if (!menuOpen) return;
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, [menuOpen]);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error();
      router.replace('/login');
      router.refresh();
    } catch {
      setLogoutError('Could not log out. Check your connection and try again.');
      setLoggingOut(false);
    }
  }

  const sidebarProps = { pathname, links, homeHref, roleName, accountEmail, profileHref, onLogout: handleLogout, loggingOut };
  const accountItems = [
    ...(!isSuperadmin && !isTrainer && canManageStaff ? [{ id: 'profile', label: 'Owner profile', href: '/profile' }] : []),
    ...(isSuperadmin ? adminNav.map(({ href, label }) => ({ id: href, href, label })) : []),
    { id: 'logout', label: loggingOut ? 'Signing out…' : 'Sign out', onSelect: handleLogout, disabled: loggingOut },
  ];

  return <div className="app-shell">
    <a href="#main-content" className="shell-skip-link">Skip to content</a>
    <aside className="sidebar desktop-sidebar" aria-label={`${roleName} workspace`}><SidebarContent {...sidebarProps} /></aside>
    <Drawer open={menuOpen} side="left" onClose={() => setMenuOpen(false)} title="Navigation" className="shell-navigation-drawer">
      <div className="shell-drawer-content"><SidebarContent {...sidebarProps} logoutError={logoutError} onNavigate={() => setMenuOpen(false)} /></div>
    </Drawer>
    <div className="main-column">
      <header className="topbar">
        <div className="topbar-left">
          <button type="button" className="menu-toggle" aria-label="Open navigation menu" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={20} strokeWidth={1.75} aria-hidden="true" /></button>
          <span className="topbar-title">{getPageTitle(pathname)}</span>
        </div>
        <div className="topbar-actions">{!isSuperadmin && <BranchSwitcher />}<span className="topbar-context">{roleName} workspace</span><Dropdown label="Account" items={accountItems} disabled={loggingOut} /></div>
      </header>
      <main id="main-content" tabIndex={-1} className="main-content">
        {logoutError && <p className="shell-logout-error" role="alert">{logoutError}</p>}
        {children}
      </main>
      <footer className="app-footer"><span>Fitivo</span><span>Your gym, in sync.</span></footer>
    </div>
  </div>;
}
