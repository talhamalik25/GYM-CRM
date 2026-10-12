"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, UserPlus, UsersRound } from "lucide-react";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Card from "../ui/card";
import EmptyState from "../ui/empty-state";
import Input from "../ui/input";
import PageHeader from "../ui/page-header";
import Select from "../ui/select";
import Table from "../ui/table";
import { listMembersApi } from "../../lib/membersService";
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
  return "neutral";
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

  const columns = [
    {
      key: "name",
      label: "Member",
      render: (member) => (
        <div className="min-w-44">
          <Link className="font-semibold text-ink hover:text-brand" href={"/members/" + member.id}>{member.name}</Link>
          {member.email && <p className="mt-1 text-xs text-ink-subtle">{member.email}</p>}
        </div>
      ),
    },
    { key: "phone", label: "Phone" },
    { key: "plan", label: "Plan" },
    { key: "startDate", label: "Start date", render: (member) => formatDate(member.startDate) },
    { key: "expiryDate", label: "Expiry date", render: (member) => formatDate(member.expiryDate) },
    { key: "status", label: "Status", render: (member) => <Badge tone={statusTone(member.status)}>{member.status}</Badge> },
    {
      key: "actions",
      label: "Actions",
      render: (member) => (
        <div className="flex items-center gap-3">
          <Link className="font-medium text-ink-muted hover:text-brand" href={"/members/" + member.id}>View</Link>
          <Link className="font-medium text-ink-muted hover:text-brand" href={"/members/" + member.id + "/edit"}>Edit</Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description="Find and manage your gym members."
        actions={<Button href="/members/new"><UserPlus size={16} aria-hidden="true" />Add Member</Button>}
      />

      <Card className="p-4 md:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(15rem,1fr)_12rem_14rem] md:items-end">
          <Input
            id="member-search"
            label="Search members"
            type="search"
            placeholder="Search by name or phone"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            autoComplete="off"
          />
          <Select id="member-status" label="Status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
            <option value="all">All statuses</option>
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
        <Card className="space-y-3 p-6" role="alert"><p className="text-sm text-error">{loadError}</p><Button variant="secondary" onClick={() => setRefreshKey((key) => key + 1)}>Try again</Button></Card>
      ) : loading && page === 1 ? (
        <Card className="p-6" aria-live="polite"><p className="text-sm text-ink-muted">Loading members…</p></Card>
      ) : total === 0 ? (
        <Card className="p-5 md:p-6">
          <EmptyState
            icon={query || statusFilter !== "all" || planFilter ? <Search size={25} strokeWidth={1.7} /> : <UsersRound size={25} strokeWidth={1.7} />}
            title={query || statusFilter !== "all" || planFilter ? "No members match your search" : "No members yet"}
            description={query || statusFilter !== "all" || planFilter ? "Try another name, phone number, status, or plan." : "Add a member to begin managing your gym roster."}
            action={query || statusFilter !== "all" || planFilter
              ? <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>
              : <Button href="/members/new"><UserPlus size={15} aria-hidden="true" />Add Member</Button>}
          />
        </Card>
      ) : (
        <Card className="min-w-0 p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">All Members</h2>
            <span className="text-xs text-ink-muted">{total} {total === 1 ? "member" : "members"}</span>
          </div>
          <Table columns={columns} rows={members} getRowKey={(member) => member.id} className="min-w-[900px]" />
          {members.length < total && (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" disabled={loading} onClick={() => setPage((current) => current + 1)}>{loading ? "Loading…" : "Load more"}</Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
