'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Activity,
  CalendarCheck2,
  ChartNoAxesColumn,
  ChevronRight,
  CreditCard,
  Dumbbell,
  LogOut,
  Menu,
  Settings,
  UserRound,
  Users,
} from 'lucide-react';

import BranchSwitcher from '../branches/branch-switcher';
import Avatar from '../ui/avatar';
import Button from '../ui/button';
import Drawer from '../ui/drawer';
import AccountMenu from './account-menu.js';
import FitivoLogo from '../brand/fitivo-logo.js';
import LanguageSwitcher from '../i18n/language-switcher.js';

export const nav = [
  { label: 'Dashboard', href: '/dashboard', Icon: Activity, group: 'Overview' },
  { label: 'Members', href: '/members', Icon: Users, group: 'Management' },
  { label: 'Membership plans', href: '/memberships', Icon: Dumbbell, group: 'Management' },
  { label: 'Attendance', href: '/attendance', Icon: CalendarCheck2, group: 'Management' },
  { label: 'Trainers', href: '/trainers', Icon: UserRound, group: 'Management' },
  { label: 'Staff', href: '/staff', Icon: Users, group: 'Management', ownerOnly: true },
  { label: 'Payments', href: '/payments', Icon: CreditCard, group: 'Finance' },
  { label: 'Reports', href: '/reports', Icon: ChartNoAxesColumn, group: 'Finance' },
  { label: 'Fitivo plan', href: '/billing', Icon: CreditCard, group: 'Finance', ownerOnly: true },
  { label: 'Settings', href: '/settings', Icon: Settings, group: 'Workspace', ownerOnly: true },
];

export const adminNav = [
  { label: 'Platform overview', href: '/admin', Icon: Activity, group: 'Overview' },
  { label: 'Gym accounts', href: '/admin/gyms', Icon: Dumbbell, group: 'Management' },
  { label: 'User accounts', href: '/admin/users', Icon: Users, group: 'Management' },
  { label: 'Plans & billing', href: '/admin/billing', Icon: CreditCard, group: 'Finance' },
];

export const trainerNav = [{ label: 'Trainer workspace', href: '/trainer', Icon: UserRound, group: 'Overview' }];

export function isActive(pathname, href) {
  return pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`));
}

export function getPageTitle(pathname) {
  if (pathname === '/profile') return 'Owner profile';
  if (pathname === '/workouts') return 'Workouts';
  if (pathname === '/branches' || pathname.startsWith('/branches/')) return 'Branches';
  return [...nav, ...adminNav, ...trainerNav].find(({ href }) => isActive(pathname, href))?.label || 'Dashboard';
}

export function getRoleName({ isSuperadmin = false, isTrainer = false, canManageStaff = false, isGymAdmin = false } = {}) {
  return isSuperadmin ? 'Super Admin' : isTrainer ? 'Trainer' : canManageStaff ? 'Gym Owner' : isGymAdmin ? 'Gym Admin' : 'Staff';
}

export function getHomeHref({ isSuperadmin = false, isTrainer = false } = {}) {
  return isSuperadmin ? '/admin' : isTrainer ? '/trainer' : '/dashboard';
}

export function getProfileHref({ isSuperadmin = false, isTrainer = false, canManageStaff = false } = {}) {
  return isSuperadmin ? '/admin/users' : isTrainer ? '/trainer' : canManageStaff ? '/profile' : '/dashboard';
}

export function getNavLinks({ isSuperadmin = false, isTrainer = false, canManageStaff = false } = {}) {
  return isSuperadmin ? adminNav : isTrainer ? trainerNav : nav.filter(({ ownerOnly }) => !ownerOnly || canManageStaff);
}

export function getAccountLinks({ canManageStaff = false, isSuperadmin = false } = {}) {
  return canManageStaff
    ? [
        { href: '/profile', label: 'My Profile' },
        { href: '/settings', label: 'Account Settings' },
      ]
    : isSuperadmin
      ? adminNav.map(({ href, label }) => ({ href, label }))
      : [];
}

const navKeyMap = {
  'Dashboard': 'dashboard',
  'Members': 'members',
  'Membership plans': 'memberships',
  'Attendance': 'attendance',
  'Trainers': 'trainers',
  'Staff': 'staff',
  'Payments': 'payments',
  'Reports': 'reports',
  'Fitivo plan': 'billing',
  'Settings': 'settings',
  'Platform overview': 'platformOverview',
  'Gym accounts': 'gymAccounts',
  'User accounts': 'userAccounts',
  'Plans & billing': 'plansBilling',
  'Trainer workspace': 'trainerWorkspace',
  'Owner profile': 'profile',
  'Workouts': 'workouts',
  'Branches': 'branches',
};

const groupKeyMap = {
  'Overview': 'overview',
  'Management': 'management',
  'Finance': 'finance',
  'Workspace': 'workspace',
};

function SidebarContent({
  pathname,
  links,
  homeHref,
  roleName,
  accountName,
  accountEmail,
  profileHref,
  onNavigate,
  onLogout,
  loggingOut,
  logoutError,
}) {
  const tNav = useTranslations('navigation');
  const groups = [...new Set(links.map(({ group }) => group))];

  return (
    <div className="flex h-full flex-col">
      {/* Brand & Workspace Header */}
      <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line px-5">
        <Link
          href={homeHref}
          className="flex items-center gap-2.5 rounded-lg py-1 outline-none transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          onClick={onNavigate}
          aria-label="Fitivo home"
        >
          <FitivoLogo width={112} height={36} priority />
        </Link>
        <span className="inline-flex items-center rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-soft-text">
          {roleName}
        </span>
      </div>

      {/* Navigation Groups */}
      <nav aria-label="Main navigation" className="sidebar-scroll min-h-0 flex-1 space-y-6 overflow-y-auto px-3.5 py-5 overscroll-contain">
        {groups.map((group) => {
          const groupLabel = groupKeyMap[group] ? tNav(groupKeyMap[group], { default: group }) : group;
          return (
            <div key={group} className="space-y-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-ink-subtle">
                {groupLabel}
              </p>
              <ul className="space-y-1">
                {links
                  .filter((link) => link.group === group)
                  .map(({ label, href, Icon }) => {
                    const active = isActive(pathname, href);
                    const itemLabel = navKeyMap[label] ? tNav(navKeyMap[label], { default: label }) : label;
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={onNavigate}
                          aria-current={active ? 'page' : undefined}
                          className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                            active
                              ? 'bg-brand-soft text-brand font-semibold shadow-xs'
                              : 'text-ink-muted hover:bg-surface-raised hover:text-ink'
                          }`}
                        >
                          {active && (
                            <span
                              aria-hidden="true"
                              className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-brand rtl:left-auto rtl:right-0 rtl:rounded-r-none rtl:rounded-l-full"
                            />
                          )}
                          <Icon
                            size={18}
                            strokeWidth={active ? 2.2 : 1.75}
                            className={`shrink-0 transition-colors ${
                              active ? 'text-brand' : 'text-ink-subtle group-hover:text-ink'
                            }`}
                            aria-hidden="true"
                          />
                          <span className="truncate">{itemLabel}</span>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Account / Profile Footer */}
      <div className="mt-auto shrink-0 border-t border-line p-3.5 bg-surface relative z-10">
        <div className="rounded-xl border border-line bg-surface p-2.5 shadow-xs transition-colors hover:border-line-strong">
          <Link
            href={profileHref}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Avatar name={accountName || accountEmail} size="sm" className="ring-1 ring-line shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold leading-tight text-ink">
                {accountName || roleName}
              </p>
              <p className="truncate text-[11px] text-ink-subtle" title={accountEmail || undefined}>
                {accountEmail || 'Signed in'}
              </p>
            </div>
          </Link>
          <div className="mt-2 border-t border-line/60 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs font-medium text-ink-muted hover:bg-danger-soft/60 hover:text-danger"
              onClick={onLogout}
              loading={loggingOut}
              loadingLabel={tNav('signingOut', { default: 'Signing out…' })}
            >
              <LogOut size={15} strokeWidth={1.75} aria-hidden="true" className="mr-1.5 rtl:mr-0 rtl:ml-1.5" />
              {tNav('signOut', { default: 'Sign out' })}
            </Button>
          </div>
          {logoutError && (
            <p className="mt-2 px-1 text-xs text-danger break-words" role="alert">
              {logoutError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardShell({
  children,
  isSuperadmin = false,
  canManageStaff = false,
  isTrainer = false,
  isGymAdmin = false,
  accountName = '',
  accountEmail = '',
}) {
  const pathname = usePathname();
  const router = useRouter();
  const tNav = useTranslations('navigation');
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  const roleName = isSuperadmin ? 'Super Admin' : isTrainer ? 'Trainer' : canManageStaff ? 'Gym Owner' : isGymAdmin ? 'Gym Admin' : 'Staff';
  const homeHref = isSuperadmin ? '/admin' : isTrainer ? '/trainer' : '/dashboard';
  const profileHref = isSuperadmin ? '/admin/users' : isTrainer ? '/trainer' : canManageStaff ? '/profile' : '/dashboard';
  const links = isSuperadmin ? adminNav : isTrainer ? trainerNav : nav.filter(({ ownerOnly }) => !ownerOnly || canManageStaff);

  useEffect(() => {
    if (!menuOpen) return;
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };
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

  const sidebarProps = {
    pathname,
    links,
    homeHref,
    roleName,
    accountName,
    accountEmail,
    profileHref,
    onLogout: handleLogout,
    loggingOut,
  };

  const accountLinks = canManageStaff
    ? [
        { href: '/profile', label: 'My Profile' },
        { href: '/settings', label: 'Account Settings' },
      ]
    : isSuperadmin
      ? adminNav.map(({ href, label }) => ({ href, label }))
      : [];

  const rawTitle = getPageTitle(pathname);
  const pageTitle = navKeyMap[rawTitle] ? tNav(navKeyMap[rawTitle], { default: rawTitle }) : rawTitle;

  return (
    <div className="relative min-h-screen bg-canvas font-sans text-ink">
      {/* Accessible skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-lg focus:outline-2 focus:outline-brand"
      >
        Skip to content
      </a>

      {/* Desktop Fixed Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface lg:flex rtl:left-auto rtl:right-0 rtl:border-r-0 rtl:border-l"
        aria-label={`${roleName} workspace`}
      >
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile Navigation Drawer */}
      <Drawer
        open={menuOpen}
        side="left"
        onClose={() => setMenuOpen(false)}
        title="Navigation"
        className="[&_.ui-modal-header]:items-center [&_.ui-modal-header]:p-4 [&_.ui-modal-content]:flex [&_.ui-modal-content]:p-0"
      >
        <div className="h-full w-full min-w-0 flex-1">
          <SidebarContent
            {...sidebarProps}
            logoutError={logoutError}
            onNavigate={() => setMenuOpen(false)}
          />
        </div>
      </Drawer>

      {/* Main Content Area (Offset by sidebar on desktop) */}
      <div className="flex min-h-screen flex-col lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64">
        {/* Sticky Topbar */}
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            {/* Mobile menu toggle */}
            <button
              type="button"
              className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-surface text-ink transition-colors hover:bg-surface-raised hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:hidden motion-reduce:transition-none"
              aria-label="Open navigation menu"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={20} strokeWidth={1.8} aria-hidden="true" />
            </button>

            {/* Breadcrumb Hierarchy & Title */}
            {pathname === '/dashboard' ? (
              <div className="hidden sm:flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-raised px-2.5 py-1 text-xs font-medium text-ink-muted border border-line/60">
                  <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  {roleName} Workspace
                </span>
              </div>
            ) : (
              <div className="min-w-0">
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-ink-subtle">
                  <span className="truncate">{roleName}</span>
                  <ChevronRight size={12} strokeWidth={2} className="shrink-0 text-ink-subtle/60 rtl:rotate-180" aria-hidden="true" />
                  <span className="truncate font-medium text-ink">{pageTitle}</span>
                </nav>
                <p className="truncate text-base font-bold tracking-tight text-ink sm:text-lg">
                  {pageTitle}
                </p>
              </div>
            )}
          </div>

          {/* Topbar Actions */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {!isSuperadmin && <BranchSwitcher />}
            <LanguageSwitcher />
            <AccountMenu
              name={accountName}
              email={accountEmail}
              role={roleName}
              links={accountLinks}
              onLogout={handleLogout}
              loggingOut={loggingOut}
            />
          </div>
        </header>

        {/* Page Content */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 lg:p-8 outline-none"
        >
          {logoutError && (
            <p
              className="mb-6 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger break-words"
              role="alert"
            >
              {logoutError}
            </p>
          )}
          {children}
        </main>

        {/* Minimal Footer */}
        <footer className="flex items-center justify-between border-t border-line/60 bg-surface px-4 py-3 text-xs text-ink-subtle sm:px-6 lg:px-8">
          <FitivoLogo width={68} height={22} />
          <span>Your gym, in sync.</span>
        </footer>
      </div>
    </div>
  );
}
