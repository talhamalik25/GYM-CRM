import {
  Activity,
  CalendarCheck2,
  ChartNoAxesColumn,
  CreditCard,
  Dumbbell,
  Settings,
  UserRound,
  Users,
} from 'lucide-react';

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
