"use client";

import { useEffect, useMemo, useState } from "react";
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
import { getInitialMembers, getMemberPlans, getMembers } from "../../lib/membersService";

const pageSize = 8;
const plans = getMemberPlans();

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
  const [members, setMembers] = useState(getInitialMembers);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [planFilter, setPlanFilter] = useState("All plans");
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => {
    const timer = window.setTimeout(() => setMembers(getMembers()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return members.filter((member) => {
      const matchesText = !normalizedQuery
        || member.name.toLowerCase().includes(normalizedQuery)
        || member.phone.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "All" || member.status === statusFilter;
      const matchesPlan = planFilter === "All plans" || member.planId === planFilter;
      return matchesText && matchesStatus && matchesPlan;
    });
  }, [members, query, statusFilter, planFilter]);

  const visibleMembers = filteredMembers.slice(0, visibleCount);
  const clearFilters = () => {
    setQuery("");
    setStatusFilter("All");
    setPlanFilter("All plans");
    setVisibleCount(pageSize);
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
            onChange={(event) => { setQuery(event.target.value); setVisibleCount(pageSize); }}
            autoComplete="off"
          />
          <Select id="member-status" label="Status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setVisibleCount(pageSize); }}>
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Expiring">Expiring</option>
            <option value="Expired">Expired</option>
          </Select>
          <Select id="member-plan" label="Plan" value={planFilter} onChange={(event) => { setPlanFilter(event.target.value); setVisibleCount(pageSize); }}>
            <option value="All plans">All plans</option>
            {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
          </Select>
        </div>
      </Card>

      {members.length === 0 ? (
        <Card className="p-5 md:p-6">
          <EmptyState
            icon={<UsersRound size={25} strokeWidth={1.7} />}
            title="No members yet"
            description="Add a member to begin managing your gym roster."
            action={<Button href="/members/new"><UserPlus size={15} aria-hidden="true" />Add Member</Button>}
          />
        </Card>
      ) : filteredMembers.length === 0 ? (
        <Card className="p-5 md:p-6">
          <EmptyState
            icon={<Search size={25} strokeWidth={1.7} />}
            title="No members match your search"
            description="Try another name, phone number, status, or plan."
            action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>}
          />
        </Card>
      ) : (
        <Card className="min-w-0 p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">All Members</h2>
            <span className="text-xs text-ink-muted">{filteredMembers.length} {filteredMembers.length === 1 ? "member" : "members"}</span>
          </div>
          <Table columns={columns} rows={visibleMembers} getRowKey={(member) => member.id} className="min-w-[900px]" />
          {visibleCount < filteredMembers.length && (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={() => setVisibleCount((count) => count + pageSize)}>Load more</Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
