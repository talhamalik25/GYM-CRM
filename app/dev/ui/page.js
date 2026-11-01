"use client";

import Button from "../../../components/ui/button.js";
import Input from "../../../components/ui/input.js";
import Select from "../../../components/ui/select.js";
import Textarea from "../../../components/ui/textarea.js";
import Badge from "../../../components/ui/badge.js";
import Card from "../../../components/ui/card.js";
import StatCard from "../../../components/ui/stat-card.js";
import DataTable from "../../../components/ui/data-table.js";
import EmptyState from "../../../components/ui/empty-state.js";
import PageHeader from "../../../components/ui/page-header.js";
import Skeleton from "../../../components/ui/skeleton.js";
import Toast from "../../../components/ui/toast.js";

const columns = [{ key: "name", label: "Item" }, { key: "status", label: "Status", render: (row) => <Badge tone="success">{row.status}</Badge> }];

export default function UiPreviewPage() {
  return <main className="mx-auto grid max-w-5xl gap-8 p-4 text-app-text sm:p-6 lg:p-8">
    <PageHeader eyebrow="Temporary preview" title="UI foundation" description="Shared Fitivo primitives and their available states." />
    <section className="flex flex-wrap gap-3" aria-label="Buttons"><Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="ghost">Ghost</Button><Button variant="danger">Danger</Button><Button loading>Loading</Button></section>
    <Card className="grid gap-4 p-5 sm:grid-cols-2"><Input label="Member name" placeholder="Enter a name" /><Select label="Status" defaultValue="active"><option value="active">Active</option><option value="inactive">Inactive</option></Select><Textarea label="Notes" className="sm:col-span-2" placeholder="Optional notes" /><Input label="Invalid example" error="Enter a valid value." defaultValue="!" /></Card>
    <section className="flex flex-wrap gap-2" aria-label="Statuses"><Badge>Neutral</Badge><Badge tone="success">Active</Badge><Badge tone="warning">Expiring</Badge><Badge tone="danger">Overdue</Badge><Badge tone="info">Information</Badge></section>
    <div className="grid gap-4 sm:grid-cols-2"><StatCard title="Members" value="—" description="Preview only" /><StatCard title="Collections" value="—" loading /></div>
    <DataTable caption="Preview table" columns={columns} rows={[{ id: "demo-1", name: "Placeholder row", status: "Active" }]} />
    <DataTable caption="Loading table" columns={columns} loading />
    <EmptyState title="No preview records" description="Add a placeholder row to see the populated table." />
    <Skeleton className="max-w-sm" />
    <Toast title="Saved" description="This is a preview notification." tone="success" />
  </main>;
}
