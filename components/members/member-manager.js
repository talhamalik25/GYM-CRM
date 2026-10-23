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
        <div>
          <Link href={"/members/" + member.id}>{member.name}</Link>
          {member.email && <p>{member.email}</p>}
        </div>
      ),
    },
    { key: "phone", label: "Phone" },
    { key: "plan", label: "Plan" },
    { key: "startDate", label: "Start date", render: (member) => formatDate(member.startDate) },
    { key: "expiryDate", label: "Expiry date", render: (member) => formatDate(member.expiryDate) },
    { key: "status", label: "Status", render: (member) => <Badge tone={statusTone(member.status)}>{member.status}</Badge> },
    { key: "account", label: "Account", render: (member) => <Badge tone={member.isActive ? "success" : "neutral"}>{member.isActive ? "Active" : "Inactive"}</Badge> },
    {
      key: "actions",
      label: "Actions",
      render: (member) => (
        <div className="members-row-actions">
          <Link href={"/members/" + member.id}>View</Link>
          <Link href={"/members/" + member.id + "/edit"}>Edit</Link>
          <button type="button" onClick={() => toggleMemberActive(member)}>{member.isActive ? "Deactivate" : "Reactivate"}</button>
        </div>
      ),
    },
  ];

  const hasFilters = Boolean(query || statusFilter !== "all" || planFilter);

  return (
    <div className="members-page">
      <PageHeader
        title="Members"
        description="Find and manage your gym members."
        actions={<Button href="/members/new"><UserPlus size={16} strokeWidth={1.75} aria-hidden="true" />Add member</Button>}
      />

      <Card className="members-filter-card">
        <div className="members-filter-grid">
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
        <Card className="members-state-card"><ErrorState title="Could not load members" description={loadError} onRetry={() => setRefreshKey((key) => key + 1)} /></Card>
      ) : loading && page === 1 ? (
        <Card className="members-state-card" role="status" aria-label="Loading members">
          <div className="members-loading-heading"><Skeleton /><Skeleton /></div>
          <div className="members-loading-rows">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} />)}</div>
        </Card>
      ) : total === 0 ? (
        <Card className="members-state-card">
          <EmptyState
            title={hasFilters ? "No members match these filters" : "No members yet"}
            description={hasFilters ? "Try another search or adjust the membership status and plan." : "Add a member to begin managing your gym roster."}
            action={hasFilters
              ? <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>
              : <Button href="/members/new"><UserPlus size={15} aria-hidden="true" />Add member</Button>}
          />
        </Card>
      ) : (
        <Card className="members-results-card">
          <div className="members-results-heading">
            <div><h2>Member directory</h2><p>Review membership details and account access.</p></div>
            <span className="members-result-count">{total.toLocaleString("en-PK")} {total === 1 ? "member" : "members"}</span>
          </div>
          <DataTable
            caption="Member directory"
            columns={columns}
            rows={members}
            getRowKey={(member) => member.id}
            className="members-data-table"
            emptyMessage="No members to show"
          />
          {members.length < total && (
            <div className="members-load-more">
              <Button variant="secondary" disabled={loading} loading={loading} loadingLabel="Loading members…" onClick={() => setPage((current) => current + 1)}>Load more</Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
