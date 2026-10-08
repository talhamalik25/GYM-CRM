'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import PageHeading from '../ui/page-heading';
import StatusBadge from '../ui/status-badge';
import { members as initialMembers } from '../../lib/mock-members';
import MemberAvatar from './member-avatar';

const pageSize = 6;
const dateLabel = (date) => new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function MemberStats({ members }) {
  const active = members.filter((member) => member.accountStatus === 'Active' && member.membership.status !== 'Expired').length;
  const expiring = members.filter((member) => member.membership.status === 'Expiring soon').length;
  const expired = members.filter((member) => member.membership.status === 'Expired').length;
  const stats = [
    { label: 'Total members', value: members.length, note: '+12% this quarter', icon: '♙', tone: 'violet' },
    { label: 'Active members', value: active, note: 'Currently enrolled', icon: '✓', tone: 'green' },
    { label: 'Expiring soon', value: expiring, note: 'Within the next 7 days', icon: '◷', tone: 'amber' },
    { label: 'Expired memberships', value: expired, note: 'Follow up to renew', icon: '↗', tone: 'blue' },
  ];
  return <section className="member-stats-grid" aria-label="Member statistics">{stats.map((stat) => <article className="member-stat-card" key={stat.label}><div className="member-stat-top"><span>{stat.label}</span><span className={`member-stat-icon ${stat.tone}`} aria-hidden="true">{stat.icon}</span></div><strong>{stat.value}</strong><small>{stat.note}</small></article>)}</section>;
}


function MemberActions({ member, onToggle }) {
  const suspended = member.accountStatus === 'Suspended';
  return <div className="member-row-actions"><Link href={`/members/${member.id}`} className="member-action-link">View</Link><Link href={`/members/${member.id}/edit`} className="member-action-link">Edit</Link><details className="member-actions-menu"><summary aria-label={`More actions for ${member.name}`}>···</summary><div className="member-action-popover"><Link href={`/members/${member.id}`}>View profile</Link><Link href={`/members/${member.id}/edit`}>Edit member</Link><button type="button" onClick={() => onToggle(member.id)}>{suspended ? 'Reactivate member' : 'Deactivate member'}</button></div></details></div>;
}

function MemberDesktopTable({ members, onToggle }) {
  if (!members.length) return null;
  return <div className="member-table-scroll"><table className="member-table"><thead><tr><th>MEMBER</th><th>MEMBERSHIP</th><th>JOIN DATE</th><th>EXPIRY DATE</th><th>ATTENDANCE</th><th>STATUS</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{members.map((member) => <tr key={member.id}><td><div className="member-table-person"><MemberAvatar member={member}/><div><Link href={`/members/${member.id}`} className="member-name-link">{member.name}</Link><small>{member.email} · {member.phone}</small></div></div></td><td><strong>{member.membership.plan}</strong><small className="member-cell-subtext">${member.membership.monthlyPrice}/month</small></td><td>{dateLabel(member.membership.startDate)}</td><td>{dateLabel(member.membership.expiryDate)}</td><td><span className="member-attendance-cell">{member.visits}<small>visits this month</small></span></td><td><StatusBadge>{member.membership.status}</StatusBadge></td><td><MemberActions member={member} onToggle={onToggle}/></td></tr>)}</tbody></table></div>;
}

function MemberMobileCards({ members, onToggle }) {
  if (!members.length) return null;
  return <div className="member-mobile-cards">{members.map((member) => <article className="member-mobile-card" key={member.id}><div className="member-mobile-heading"><div className="member-table-person"><MemberAvatar member={member}/><div><Link href={`/members/${member.id}`} className="member-name-link">{member.name}</Link><small>{member.email}</small></div></div><StatusBadge>{member.membership.status}</StatusBadge></div><div className="member-mobile-contact">{member.phone}</div><div className="member-mobile-facts"><span><small>Membership</small><strong>{member.membership.plan}</strong></span><span><small>Joined</small><strong>{dateLabel(member.membership.startDate)}</strong></span><span><small>Expires</small><strong>{dateLabel(member.membership.expiryDate)}</strong></span><span><small>Attendance</small><strong>{member.visits} visits</strong></span></div><div className="member-mobile-actions"><Link href={`/members/${member.id}`} className="button button-secondary">View profile</Link><Link href={`/members/${member.id}/edit`} className="button button-secondary">Edit</Link><button type="button" className="member-mobile-deactivate" onClick={() => onToggle(member.id)}>{member.accountStatus === 'Suspended' ? 'Reactivate' : 'Deactivate'}</button></div></article>)}</div>;
}

function MemberLoadingSkeleton() {
  return <div className="member-loading" aria-label="Loading members" role="status"><span className="sr-only">Loading members…</span>{[1, 2, 3, 4].map((item) => <div className="member-skeleton-card" key={item}><i/><i/><i/></div>)}</div>;
}

export default function MemberManager() {
  const [rows, setRows] = useState(initialMembers);
  const [query, setQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('All plans');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [dateFilter, setDateFilter] = useState('Any join date');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setLoading(false), 280);
    return () => window.clearTimeout(timeout);
  }, []);

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const dateCutoffs = { 'Last 30 days': '2026-09-06', 'Last 90 days': '2026-07-08' };
    return rows.filter((member) => {
      const searchText = [member.name, member.email, member.phone].join(' ').toLowerCase();
      const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery);
      const matchesPlan = planFilter === 'All plans' || member.membership.plan === planFilter;
      const matchesStatus = statusFilter === 'All statuses' || member.membership.status === statusFilter;
      const matchesDate = !dateCutoffs[dateFilter] || member.membership.startDate >= dateCutoffs[dateFilter];
      return matchesQuery && matchesPlan && matchesStatus && matchesDate;
    });
  }, [rows, query, planFilter, statusFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const visibleMembers = filteredMembers.slice((page - 1) * pageSize, page * pageSize);
  const updateFilter = (setter) => (event) => { setter(event.target.value); setPage(1); };
  const resetFilters = () => { setQuery(''); setPlanFilter('All plans'); setStatusFilter('All statuses'); setDateFilter('Any join date'); setPage(1); };
  const toggleMember = (id) => setRows((current) => current.map((member) => {
    if (member.id !== id) return member;
    const isSuspended = member.accountStatus === 'Suspended';
    const nextStatus = isSuspended ? (member.membershipStatus === 'Suspended' ? 'Active' : member.membershipStatus) : 'Suspended';
    return { ...member, accountStatus: isSuspended ? 'Active' : 'Suspended', membership: { ...member.membership, status: nextStatus } };
  }));

  return <div className="members-page"><PageHeading eyebrow="MEMBER MANAGEMENT" title="Members" description="Get to know your community and keep every member moving." action={<Link className="button button-primary" href="/members/new"><span aria-hidden="true">＋</span> Add member</Link>}/><MemberStats members={rows}/>{loading ? <MemberLoadingSkeleton/> : <section className="panel members-panel" aria-label="Members list"><div className="members-toolbar"><label className="member-search"><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={updateFilter(setQuery)} placeholder="Search name, email or phone..." aria-label="Search members by name, email, or phone"/></label><div className="member-filters"><label><span className="sr-only">Filter by membership</span><select value={planFilter} onChange={updateFilter(setPlanFilter)}><option>All plans</option><option>Unlimited</option><option>Strength</option><option>Off-peak</option></select></label><label><span className="sr-only">Filter by status</span><select value={statusFilter} onChange={updateFilter(setStatusFilter)}><option>All statuses</option><option>Active</option><option>Expiring soon</option><option>Expired</option><option>Suspended</option></select></label><label><span className="sr-only">Filter by join date</span><select value={dateFilter} onChange={updateFilter(setDateFilter)}><option>Any join date</option><option>Last 30 days</option><option>Last 90 days</option></select></label></div></div>{filteredMembers.length ? <><MemberDesktopTable members={visibleMembers} onToggle={toggleMember}/><MemberMobileCards members={visibleMembers} onToggle={toggleMember}/><div className="member-pagination"><span>Showing <strong>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredMembers.length)}</strong> of <strong>{filteredMembers.length}</strong> members</span><div><button className="page-button" type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>← Previous</button><span>Page {page} of {totalPages}</span><button className="page-button" type="button" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>Next →</button></div></div></> : <div className="member-empty-state"><span className="member-empty-icon">⌕</span><h2>{rows.length ? 'No members match those filters' : 'Your member list is empty'}</h2><p>{rows.length ? 'Try a different search or clear the filters to see all members.' : 'Add a member to start building your gym community.'}</p>{rows.length ? <button className="button button-secondary" type="button" onClick={resetFilters}>Clear filters</button> : <Link className="button button-primary" href="/members/new">＋ Add member</Link>}</div>}</section>}</div>;
}



