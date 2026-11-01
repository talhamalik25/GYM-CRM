"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Card from "../ui/card";
import EmptyState from "../ui/empty-state";
import ErrorState from "../ui/error-state";
import PageHeader from "../ui/page-header";
import SearchBar from "../ui/search-bar";
import Select from "../ui/select";
import DataTable from "../ui/data-table";
import Skeleton from "../ui/skeleton";
import { listMembersApi, setMemberActiveApi } from "../../lib/membersService";
import { listPlans } from "../../lib/plansService";

const pageSize = 8;

function formatDate(date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date + "T12:00:00Z"));
}

function statusTone(status) {
  if (status === "Active") return "success";
  if (status === "Expiring") return "warning";
  if (status === "Expired" || status === "Cancelled") return "error";
  return "neutral";
}

function MemberActions({ member, onToggle }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button href={`/members/${member.id}`} variant="ghost" size="sm">View</Button>
      <Button href={`/members/${member.id}/edit`} variant="ghost" size="sm">Edit</Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => onToggle(member)}>
        {member.isActive ? "Deactivate" : "Reactivate"}
      </Button>
    </div>
  );
}

export default function MemberManager() {
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    listPlans().then((items) => { if (!cancelled) setPlans(items); }).catch((error) => {
      if (!cancelled) setLoadError(error.message || "Could not load plans.");
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setLoadError("");
      try {
        const result = await listMembersApi({
          search: debouncedQuery,
          status: statusFilter,
          planId: planFilter,
          page,
          limit: pageSize,
        });
        if (!cancelled) {
          setMembers((current) => page === 1 ? result.items : [...current, ...result.items]);
          setTotal(result.total);
        }
      } catch (error) {
        if (!cancelled) setLoadError(error.message || "Could not load members.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [debouncedQuery, statusFilter, planFilter, page, refreshKey]);

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setPlanFilter("");
    setPage(1);
  };

  async function toggleMemberActive(member) {
    const nextActive = !member.isActive;
    const action = nextActive ? "reactivate" : "deactivate";
    if (!window.confirm(`${action[0].toUpperCase()}${action.slice(1)} ${member.name}? Existing membership and payment history will be kept.`)) return;
    try {
      await setMemberActiveApi(member.id, nextActive);
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setLoadError(error.message || `Could not ${action} this member.`);
    }
  }

  const columns = [
    {
      key: "name",
      label: "Member",
      render: (member) => (
        <div className="min-w-40">
          <Link className="font-semibold text-ink hover:text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" href={`/members/${member.id}`}>{member.name}</Link>
          {member.email && <p className="mt-1 text-xs text-ink-muted">{member.email}</p>}
        </div>
      ),
    },
    { key: "phone", label: "Phone" },
    { key: "plan", label: "Plan" },
    { key: "startDate", label: "Start date", render: (member) => formatDate(member.startDate) },
    { key: "expiryDate", label: "Expiry date", render: (member) => formatDate(member.expiryDate) },
    { key: "status", label: "Membership", render: (member) => <Badge tone={statusTone(member.status)}>{member.status}</Badge> },
    { key: "account", label: "Account", render: (member) => <Badge tone={member.isActive ? "success" : "neutral"}>{member.isActive ? "Active" : "Inactive"}</Badge> },
    { key: "actions", label: "Actions", render: (member) => <MemberActions member={member} onToggle={toggleMemberActive} /> },
  ];

  const hasFilters = Boolean(query || statusFilter !== "all" || planFilter);

  return (
    <div className="space-y-5 md:space-y-6">
      <PageHeader
        title="Members"
        description="Find and manage your gym members."
        actions={<Button href="/members/new"><UserPlus size={16} strokeWidth={1.75} aria-hidden="true" />Add member</Button>}
      />

      <Card className="p-4 md:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SearchBar
            id="member-search"
            label="Search members"
            placeholder="Search by name or phone"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            onClear={() => { setQuery(""); setPage(1); }}
            autoComplete="off"
          />
          <Select id="member-status" label="Membership status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
            <option value="all">All statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring</option>
            <option value="expired">Expired</option>
          </Select>
          <Select id="member-plan" label="Plan" value={planFilter} onChange={(event) => { setPlanFilter(event.target.value); setPage(1); }}>
            <option value="">All plans</option>
            {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
          </Select>
        </div>
      </Card>

      {loadError ? (
        <Card className="p-4 md:p-5"><ErrorState title="Could not load members" description={loadError} onRetry={() => setRefreshKey((key) => key + 1)} /></Card>
      ) : loading && page === 1 ? (
        <Card className="space-y-4 p-4 md:p-5" role="status" aria-label="Loading members">
          <Skeleton className="h-6 max-w-52" />
          <div className="space-y-3">{Array.from({ length: 5 }, (_, index) => <Skeleton className="h-12" key={index} />)}</div>
        </Card>
      ) : total === 0 ? (
        <Card className="p-4 md:p-5">
          <EmptyState
            title={hasFilters ? "No members match these filters" : "No members yet"}
            description={hasFilters ? "Try another search or adjust the membership status and plan." : "Add a member to begin managing your gym roster."}
            action={hasFilters
              ? <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>
              : <Button href="/members/new"><UserPlus size={15} aria-hidden="true" />Add member</Button>}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden p-4 md:p-5">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 className="text-base font-semibold text-ink">Member directory</h2><p className="mt-1 text-sm text-ink-muted">Review membership details and account access.</p></div>
            <span className="text-sm text-ink-muted">{total.toLocaleString("en-PK")} {total === 1 ? "member" : "members"}</span>
          </div>
          <div className="hidden md:block">
            <DataTable caption="Member directory" columns={columns} rows={members} getRowKey={(member) => member.id} emptyMessage="No members to show" />
          </div>
          <ul className="divide-y divide-line md:hidden" aria-label="Member directory">
            {members.map((member) => (
              <li className="space-y-3 py-4 first:pt-1 last:pb-1" key={member.id}>
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0"><Link className="break-words font-semibold text-ink hover:text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" href={`/members/${member.id}`}>{member.name}</Link><p className="mt-1 break-all text-sm text-ink-muted">{member.phone}</p></div>
                  <Badge tone={statusTone(member.status)}>{member.status}</Badge>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <div><dt className="text-xs text-ink-muted">Plan</dt><dd className="mt-0.5 break-words text-ink">{member.plan}</dd></div>
                  <div><dt className="text-xs text-ink-muted">Expiry</dt><dd className="mt-0.5 text-ink">{formatDate(member.expiryDate)}</dd></div>
                  <div><dt className="text-xs text-ink-muted">Account</dt><dd className="mt-0.5 text-ink">{member.isActive ? "Active" : "Inactive"}</dd></div>
                  <div><dt className="text-xs text-ink-muted">Started</dt><dd className="mt-0.5 text-ink">{formatDate(member.startDate)}</dd></div>
                </dl>
                <MemberActions member={member} onToggle={toggleMemberActive} />
              </li>
            ))}
          </ul>
          {members.length < total && (
            <div className="mt-4 flex justify-center border-t border-line pt-4">
              <Button variant="secondary" disabled={loading} loading={loading} loadingLabel="Loading members…" onClick={() => setPage((current) => current + 1)}>Load more</Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
