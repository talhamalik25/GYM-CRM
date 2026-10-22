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
    <div className="ui-table-wrap" role="region" aria-label={caption} tabIndex={0}>
      <table {...props} className={`ui-table ${className}`.trim()}>
        <caption className="sr-only">{caption}</caption>
        <thead><tr>{columns.map((column) => {
          const sortable = column.sortable && typeof onSortChange === "function";
          const active = sort?.key === column.key;
          const SortIcon = active ? (sort.direction === "desc" ? ArrowDown : ArrowUp) : ChevronsUpDown;
          return <th key={column.key} scope="col" aria-sort={sortable ? (active ? (sort.direction === "desc" ? "descending" : "ascending") : "none") : undefined} className={column.headerClassName}>
            {sortable ? <button type="button" className="ui-table-sort" disabled={loading} onClick={() => onSortChange({ key: column.key, direction: active && sort.direction === "asc" ? "desc" : "asc" })}>{column.label}<SortIcon size={15} aria-hidden="true" /></button> : column.label}
          </th>;
        })}</tr></thead>
        <tbody>{loading ? Array.from({ length: Math.max(1, loadingRows) }, (_, index) => <tr key={index} aria-hidden="true">{columns.map(column => <td key={column.key}><Skeleton className="ui-table-skeleton" /></td>)}</tr>) : rows?.length ? rows.map((row, index) => <tr key={getRowKey ? getRowKey(row) : row.id ?? row._id ?? index}>{columns.map(column => <td key={column.key} className={column.className}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>) : <tr><td colSpan={Math.max(1, columns.length)} className="ui-table-empty"><EmptyState title={emptyMessage} description={emptyDescription} action={emptyAction} /></td></tr>}</tbody>
      </table>
    </div>
    {canPaginate && <nav className="ui-pagination" aria-label={`${caption} pagination`}>
      <span aria-live="polite">{total ? `${Math.min((page - 1) * pageSize + 1, total)}–${Math.min(page * pageSize, total)} of ${total}` : "0 records"}</span>
      <div><Button type="button" variant="secondary" size="sm" disabled={loading || page <= 1} onClick={() => pagination.onPageChange(page - 1)}>Previous</Button><span>Page {page} of {pageCount}</span><Button type="button" variant="secondary" size="sm" disabled={loading || page >= pageCount} onClick={() => pagination.onPageChange(page + 1)}>Next</Button></div>
    </nav>}
  </div>;
}
