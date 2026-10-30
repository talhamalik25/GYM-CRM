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
    <Link href={homeHref} className={"brand exact:flex exact:items-center exact:[gap:10px] exact:[flex-shrink:0] exact:[min-height:44px] exact:[border-radius:var(--radius-input)]"} onClick={onNavigate} aria-label="Fitivo home">
      <span className={"brand-mark exact:grid exact:[place-items:center] exact:[flex:0_0_36px] exact:[width:36px] exact:[height:36px] exact:[border-radius:var(--radius-input)] exact:[background:var(--brand)] exact:[color:var(--on-brand)]"}><Zap size={22} strokeWidth={1.75} aria-hidden="true" /></span>
      <span className={"brand-copy exact:grid exact:[min-width:0] exact:[gap:2px]"}><span className={"fitivo-wordmark exact:[font-size:18px] exact:[font-weight:700] exact:[letter-spacing:var(--tracking-tight)] exact:[line-height:1.2]"}>Fitivo</span><span className={"workspace-caption exact:[color:var(--ink-subtle)] exact:[font-size:12px] exact:[line-height:1.4]"}>{roleName} workspace</span></span>
    </Link>
    <nav aria-label="Main navigation" className={"side-nav exact:grid exact:[gap:24px] exact:[margin-top:28px]"}>
      {groups.map((group) => <div className="nav-group" key={group}>
        <p className={"nav-label exact:[margin:0_12px_8px] exact:[color:var(--ink-subtle)] exact:[font-size:11px] exact:[font-weight:600] exact:[letter-spacing:.08em] exact:[text-transform:uppercase]"}>{group}</p>
        <ul className={"nav-items exact:grid exact:[gap:4px] exact:[list-style:none] exact:[padding:0] exact:[margin:0]"}>
          {links.filter((link) => link.group === group).map(({ label, href, Icon }) => {
            const active = isActive(pathname, href);
            return <li key={href}><Link href={href} onClick={onNavigate} className={`nav-link exact:flex exact:items-center exact:[gap:10px] exact:[min-height:42px] exact:[padding:10px_12px] exact:[border-radius:var(--radius-input)] exact:[color:var(--grey-700)] exact:[font-size:14px] exact:[font-weight:500] exact:[transition:background_var(--motion-fast),_color_var(--motion-fast)] exact:[&:hover]:[background:var(--surface-raised)] exact:[&.active]:[background:var(--brand-soft)] exact:[&.active]:[color:var(--brand-soft-text)] exact:[&.active]:[font-weight:600] ${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
              <Icon className={"nav-icon exact:[flex-shrink:0]"} size={18} strokeWidth={1.75} aria-hidden="true" /><span>{label}</span>
            </Link></li>;
          })}
        </ul>
      </div>)}
    </nav>
    <div className={"sidebar-bottom exact:[margin-top:auto] exact:[padding-top:24px]"}>
      <div className={"shell-account-card exact:[padding:10px] exact:[border:1px_solid_var(--line)] exact:[border-radius:12px]"}>
        <Link className={"profile-button exact:flex exact:items-center exact:[gap:10px] exact:[padding:4px] exact:[border-radius:var(--radius-input)] exact:[&:hover]:[background:var(--surface-raised)]"} href={profileHref} onClick={onNavigate}>
          <Avatar name={accountEmail} size="sm" />
          <span className={"profile-copy exact:[min-width:0] exact:[&_strong]:block exact:[&_strong]:[font-size:13px] exact:[&_strong]:[font-weight:600] exact:[&_small]:block exact:[&_small]:overflow-hidden exact:[&_small]:[text-overflow:ellipsis] exact:[&_small]:[white-space:nowrap] exact:[&_small]:[color:var(--ink-subtle)] exact:[&_small]:[font-size:12px] exact:[&_small]:[margin-top:2px]"}><strong>{roleName}</strong><small title={accountEmail || undefined}>{accountEmail || 'Signed in'}</small></span>
        </Link>
        <Button type="button" variant="ghost" className={"shell-signout exact:[width:100%] exact:[justify-content:flex-start] exact:[margin-top:8px]"} onClick={onLogout} loading={loggingOut} loadingLabel="Signing out…"><LogOut size={16} strokeWidth={1.75} aria-hidden="true" />Sign out</Button>
        {logoutError && <p className={"shell-account-error exact:[color:var(--danger)] exact:[font-size:13px] exact:[overflow-wrap:anywhere] exact:[margin:8px_4px_0]"} role="alert">{logoutError}</p>}
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

  return <div className={"app-shell exact:[min-height:100vh]"}>
    <a href="#main-content" className={"shell-skip-link exact:fixed exact:[top:12px] exact:[left:12px] exact:[z-index:100] exact:[transform:translateY(-200%)] exact:[padding:12px_16px] exact:[border-radius:var(--radius-input)] exact:[background:var(--surface)] exact:[color:var(--ink)] exact:[box-shadow:var(--shadow-md)] exact:[&:focus]:[transform:translateY(0)]"}>Skip to content</a>
    <aside className={"sidebar exact:fixed exact:[inset:0_auto_0_0] exact:[z-index:30] exact:flex exact:flex-col exact:[width:var(--sidebar-width)] exact:[padding:20px_16px] exact:[overflow-y:auto] exact:[overscroll-behavior:contain] exact:[background:var(--surface)] exact:[color:var(--ink)] exact:[border-right:1px_solid_var(--line)] desktop-sidebar exact:at-most-1023:hidden"} aria-label={`${roleName} workspace`}><SidebarContent {...sidebarProps} /></aside>
    <Drawer open={menuOpen} side="left" onClose={() => setMenuOpen(false)} title="Navigation" className={"shell-navigation-drawer exact:[&_.ui-modal-header]:[padding:12px_16px] exact:[&_.ui-modal-header]:items-center exact:[&_.ui-modal-header_h2]:[font-size:14px] exact:[&_.ui-icon-button]:[width:44px] exact:[&_.ui-icon-button]:[height:44px] exact:[&_.ui-modal-content]:flex exact:[&_.ui-modal-content]:[padding:20px_16px_max(20px,_env(safe-area-inset-bottom))]"}>
      <div className={"shell-drawer-content exact:flex exact:flex-col exact:[width:100%] exact:[min-width:0] exact:[flex-shrink:0]"}><SidebarContent {...sidebarProps} logoutError={logoutError} onNavigate={() => setMenuOpen(false)} /></div>
    </Drawer>
    <div className={"main-column exact:flex exact:flex-col exact:[min-width:0] exact:[min-height:100vh] exact:[margin-left:var(--sidebar-width)] exact:at-most-1023:[margin-left:0]"}>
      <header className={"topbar exact:sticky exact:[top:0] exact:[z-index:15] exact:flex exact:items-center exact:[justify-content:space-between] exact:[gap:16px] exact:[min-height:var(--topbar-height)] exact:[padding:10px_var(--page-padding-x)] exact:[background:var(--surface)] exact:[border-bottom:1px_solid_var(--line)] exact:[&_.ui-dropdown>button]:[min-height:42px] exact:[&_.ui-dropdown_svg]:[stroke-width:1.75] exact:at-most-1023:[padding-inline:24px] exact:at-most-600:[gap:8px] exact:at-most-600:[padding-inline:16px]"}>
        <div className={"topbar-left exact:flex exact:items-center exact:[gap:12px] exact:[min-width:0] exact:at-most-600:[gap:8px]"}>
          <button type="button" className={"menu-toggle exact:hidden exact:at-most-1023:grid exact:at-most-1023:[place-items:center] exact:at-most-1023:[flex-shrink:0] exact:at-most-1023:[width:44px] exact:at-most-1023:[height:44px] exact:at-most-1023:[padding:0] exact:at-most-1023:[border:1px_solid_var(--line)] exact:at-most-1023:[border-radius:var(--radius-input)] exact:at-most-1023:[background:var(--surface)] exact:at-most-1023:[color:var(--ink)] exact:at-most-1023:[&:hover]:[background:var(--surface-raised)]"} aria-label="Open navigation menu" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={20} strokeWidth={1.75} aria-hidden="true" /></button>
          <span className={"topbar-title exact:[font-size:14px] exact:[font-weight:600] exact:overflow-hidden exact:[white-space:nowrap] exact:[text-overflow:ellipsis]"}>{getPageTitle(pathname)}</span>
        </div>
        <div className={"topbar-actions exact:flex exact:items-center exact:[gap:12px] exact:[min-width:0] exact:[flex-shrink:0]"}>{!isSuperadmin && <BranchSwitcher />}<span className={"topbar-context exact:[color:var(--ink-subtle)] exact:[font-size:13px] exact:at-most-600:hidden"}>{roleName} workspace</span><Dropdown label="Account" items={accountItems} disabled={loggingOut} /></div>
      </header>
      <main id="main-content" tabIndex={-1} className={"main-content exact:[flex:1] exact:[width:100%] exact:[min-width:0] exact:[max-width:1600px] exact:[padding:var(--page-padding-y)_var(--page-padding-x)] exact:[margin:0_auto] exact:at-most-1023:[padding:24px] exact:at-most-600:[padding:24px_16px]"}>
        {logoutError && <p className={"shell-logout-error exact:[color:var(--danger)] exact:[font-size:13px] exact:[overflow-wrap:anywhere] exact:[padding:12px_16px] exact:[margin:0_0_24px] exact:[border-radius:var(--radius-input)] exact:[background:var(--danger-soft)]"} role="alert">{logoutError}</p>}
        {children}
      </main>
      <footer className={"app-footer exact:flex exact:[justify-content:space-between] exact:[gap:16px] exact:[padding:12px_var(--page-padding-x)_20px] exact:[color:var(--ink-subtle)] exact:[font-size:12px] exact:at-most-1023:[padding-inline:24px] exact:at-most-600:[padding-inline:16px]"}><span>Fitivo</span><span>Your gym, in sync.</span></footer>
    </div>
  </div>;
}
