"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import Button from "./button";
import EmptyState from "./empty-state";
import Skeleton from "./skeleton";

// Rows, sorting and pagination are owned by the caller; this never fetches,
// reorders or slices records. Only enable sort where the data source supports it.
export default function DataTable({ columns = [], rows = [], getRowKey, className = "", caption = "Records", emptyMessage = "No records to show.", emptyDescription, emptyAction, loading = false, loadingRows = 5, sort, onSortChange, pagination, ...props }) {
  const pageSize = Math.max(1, pagination?.pageSize || 10);
  const total = Math.max(0, pagination?.total || 0);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.max(1, pagination?.page || 1);
  const canPaginate = pagination && typeof pagination.onPageChange === "function";
  return <div className="ui-data-table" aria-busy={loading || undefined}>
    {loading && <span role="status" className="sr-only">Loading records</span>}
    <div className={"ui-table-wrap exact:[width:100%] exact:[overflow-x:auto] exact:[border:1px_solid_var(--line)] exact:[border-radius:var(--radius-lg)] exact:[background:var(--surface)] exact:[overscroll-behavior-x:contain] exact:[scrollbar-gutter:stable] exact:[min-width:0] exact:[max-width:100%]"} role="region" aria-label={caption} tabIndex={0}>
      <table {...props} className={`ui-table exact:[width:100%] exact:[border-collapse:collapse] exact:[text-align:left] exact:[font-size:13px] exact:[&_th]:[padding:11px_16px] exact:[&_th]:[border-bottom:1px_solid_var(--line)] exact:[&_th]:[white-space:nowrap] exact:[&_th]:[letter-spacing:.035em] exact:[&_th]:[text-transform:none] exact:[&_th]:[background:var(--table-header)] exact:[&_th]:[color:var(--ink-subtle)] exact:[&_th]:[font-size:12px] exact:[&_th]:[font-weight:600] exact:[&_td]:[padding:13px_16px] exact:[&_td]:[border-bottom:1px_solid_var(--line)] exact:[&_td]:[color:var(--ink)] exact:[&_td]:[line-height:1.45] exact:[&_td]:[font-variant-numeric:tabular-nums] exact:[&_td]:[border-bottom-color:var(--divider)] exact:[&_tbody_tr:last-child_td]:[border-bottom:0] exact:[&_tbody_tr:hover]:[background:var(--surface-raised)] ${className}`.trim()}>
        <caption className="sr-only">{caption}</caption>
        <thead><tr>{columns.map((column) => {
          const sortable = column.sortable && typeof onSortChange === "function";
          const active = sort?.key === column.key;
          const SortIcon = active ? (sort.direction === "desc" ? ArrowDown : ArrowUp) : ChevronsUpDown;
          return <th key={column.key} scope="col" aria-sort={sortable ? (active ? (sort.direction === "desc" ? "descending" : "ascending") : "none") : undefined} className={column.headerClassName}>
            {sortable ? <button type="button" className={"ui-table-sort exact:inline-flex exact:items-center exact:[gap:var(--space-2)] exact:[padding:var(--space-1)_0] exact:[border:0] exact:[background:transparent] exact:[color:inherit] exact:[font:inherit] exact:cursor-pointer"} disabled={loading} onClick={() => onSortChange({ key: column.key, direction: active && sort.direction === "asc" ? "desc" : "asc" })}>{column.label}<SortIcon size={15} aria-hidden="true" /></button> : column.label}
          </th>;
        })}</tr></thead>
        <tbody>{loading ? Array.from({ length: Math.max(1, loadingRows) }, (_, index) => <tr key={index} aria-hidden="true">{columns.map(column => <td key={column.key}><Skeleton className={"ui-table-skeleton exact:[min-width:var(--space-16)]"} /></td>)}</tr>) : rows?.length ? rows.map((row, index) => <tr key={getRowKey ? getRowKey(row) : row.id ?? row._id ?? index}>{columns.map(column => <td key={column.key} className={column.className}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>) : <tr><td colSpan={Math.max(1, columns.length)} className={"ui-table-empty exact:[padding:40px]! exact:text-center exact:[color:var(--ink-subtle)]!"}><EmptyState title={emptyMessage} description={emptyDescription} action={emptyAction} /></td></tr>}</tbody>
      </table>
    </div>
    {canPaginate && <nav className={"ui-pagination exact:flex exact:items-center exact:[justify-content:space-between] exact:[gap:var(--space-3)] exact:flex-wrap exact:[padding:var(--space-4)_0] exact:[color:var(--ink-muted)] exact:[font-size:var(--text-xs)] exact:[&>div]:flex exact:[&>div]:items-center exact:[&>div]:[justify-content:space-between] exact:[&>div]:[gap:var(--space-3)] exact:[&>div]:flex-wrap exact:at-most-768:[&>div]:[width:100%]"} aria-label={`${caption} pagination`}>
      <span aria-live="polite">{total ? `${Math.min((page - 1) * pageSize + 1, total)}–${Math.min(page * pageSize, total)} of ${total}` : "0 records"}</span>
      <div><Button type="button" variant="secondary" size="sm" disabled={loading || page <= 1} onClick={() => pagination.onPageChange(page - 1)}>Previous</Button><span>Page {page} of {pageCount}</span><Button type="button" variant="secondary" size="sm" disabled={loading || page >= pageCount} onClick={() => pagination.onPageChange(page + 1)}>Next</Button></div>
    </nav>}
  </div>;
}
