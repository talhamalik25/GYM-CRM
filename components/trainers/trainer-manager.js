"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, UserRoundPlus, UsersRound } from "lucide-react";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Card from "../ui/card";
import EmptyState from "../ui/empty-state";
import Input from "../ui/input";
import PageHeader from "../ui/page-header";
import Select from "../ui/select";
import Table from "../ui/table";
import { listTrainers } from "../../lib/trainersService";

const pageSize = 10;
function formatDate(value) { return value ? new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`)) : "—"; }
function Avatar({ trainer }) { return trainer.profileImage ? <Image src={trainer.profileImage} alt={`${trainer.fullName} profile`} width={40} height={40} unoptimized className="h-10 w-10 rounded-full object-cover" /> : <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand">{trainer.fullName.split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase()}</span>; }

export default function TrainerManager() {
  const [items, setItems] = useState([]); const [total, setTotal] = useState(0); const [specializations, setSpecializations] = useState([]);
  const [search, setSearch] = useState(""); const [status, setStatus] = useState("all"); const [specialization, setSpecialization] = useState(""); const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [retry, setRetry] = useState(0);
  useEffect(() => { let cancelled = false; const timer = window.setTimeout(async () => { setLoading(true); setError(""); try { const result = await listTrainers({ search: search.trim(), status, specialization, page, limit: pageSize }); if (!cancelled) { setItems(result.items); setTotal(result.total); setSpecializations(result.specializations || []); } } catch (e) { if (!cancelled) setError(e.message); } finally { if (!cancelled) setLoading(false); } }, 250); return () => { cancelled = true; window.clearTimeout(timer); }; }, [search, status, specialization, page, retry]);
  const columns = [
    { key: "trainer", label: "Trainer", render: trainer => <span className="flex min-w-52 items-center gap-3"><Avatar trainer={trainer}/><span><Link className="font-semibold text-ink hover:text-brand" href={`/trainers/${trainer.id}`}>{trainer.fullName}</Link><small className="mt-1 block text-xs text-ink-subtle">{trainer.email}</small></span></span> },
    { key: "phone", label: "Phone" }, { key: "specialization", label: "Specialization" },
    { key: "joiningDate", label: "Joined", render: trainer => formatDate(trainer.joiningDate) },
    { key: "assignedMemberCount", label: "Assigned members" },
    { key: "status", label: "Status", render: trainer => <Badge tone={trainer.status === "active" ? "success" : "neutral"}>{trainer.status === "active" ? "Active" : "Inactive"}</Badge> },
    { key: "actions", label: "Actions", render: trainer => <span className="flex gap-3"><Link className="font-medium text-ink-muted hover:text-brand" href={`/trainers/${trainer.id}`}>View</Link><Link className="font-medium text-ink-muted hover:text-brand" href={`/trainers/${trainer.id}/edit`}>Edit</Link></span> },
  ];
  return <div className="space-y-6">
    <PageHeader title="Trainers" description="Manage trainer profiles and member assignments." actions={<Button href="/trainers/new"><UserRoundPlus size={16} aria-hidden="true"/>Add Trainer</Button>} />
    <Card className="p-4 md:p-5"><div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(15rem,1fr)_12rem_14rem] md:items-end"><Input id="trainer-search" label="Search trainers" type="search" placeholder="Name, email, phone or specialty" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }}/><Select id="trainer-status-filter" label="Status" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></Select><Select id="trainer-specialization-filter" label="Specialization" value={specialization} onChange={event => { setSpecialization(event.target.value); setPage(1); }}><option value="">All specializations</option>{specializations.map(item => <option key={item} value={item}>{item}</option>)}</Select></div></Card>
    {error ? <Card className="space-y-3 p-6" role="alert"><p className="text-sm text-error">{error}</p><Button variant="secondary" onClick={() => setRetry(value => value + 1)}>Try again</Button></Card> : loading ? <Card className="p-6" role="status"><p className="text-sm text-ink-muted">Loading trainers…</p></Card> : total === 0 ? <Card className="p-5 md:p-6"><EmptyState icon={search || status !== "all" || specialization ? <Search size={25}/> : <UsersRound size={25}/>} title={search || status !== "all" || specialization ? "No trainers match your filters" : "No trainers yet"} description={search || status !== "all" || specialization ? "Try a different search or clear the filters." : "Add a trainer to start managing your coaching team."} action={search || status !== "all" || specialization ? <Button variant="secondary" onClick={() => { setSearch(""); setStatus("all"); setSpecialization(""); setPage(1); }}>Clear filters</Button> : <Button href="/trainers/new"><UserRoundPlus size={15}/>Add Trainer</Button>}/></Card> : <Card className="min-w-0 p-4 md:p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold">All Trainers</h2><span className="text-xs text-ink-muted">{total} {total === 1 ? "trainer" : "trainers"}</span></div><Table columns={columns} rows={items} getRowKey={trainer => trainer.id} className="min-w-[900px]"/><div className="mt-4 flex items-center justify-between text-sm text-ink-muted"><span>Page {page} · {items.length} shown</span><span className="flex gap-2"><Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</Button><Button variant="secondary" size="sm" disabled={page * pageSize >= total} onClick={() => setPage(value => value + 1)}>Next</Button></span></div></Card>}
  </div>;
}
