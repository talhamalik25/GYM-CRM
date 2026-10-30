"use client";

import { useId, useState } from "react";
import Card from "./card";
import DataTable from "./data-table";
import EmptyState from "./empty-state";
import Skeleton from "./skeleton";

export default function ChartCard({
  title,
  description,
  action,
  children,
  table,
  ariaLabel,
  loading = false,
  loadingLabel,
  empty = false,
  emptyTitle = "No data to show",
  emptyDescription,
  emptyIcon,
  className = "",
}) {
  const [view, setView] = useState("chart");
  const titleId = useId();
  const label = ariaLabel || title;
  const hasTable = Boolean(table?.columns?.length);

  return <Card className={`ui-chart-card exact:[min-width:0] exact:[padding:var(--card-padding)] ${className}`.trim()} aria-busy={loading || undefined}>
    <header className={"ui-chart-card-header exact:flex exact:[align-items:flex-start] exact:[justify-content:space-between] exact:[gap:var(--space-4)] exact:[margin-bottom:var(--space-5)]"}>
      <div className={"ui-chart-card-heading exact:[min-width:0] exact:[&_h2]:[margin:0] exact:[&_h2]:[color:var(--ink)] exact:[&_h2]:[font-size:var(--type-section)] exact:[&_h2]:[font-weight:var(--weight-semibold)] exact:[&_h2]:[line-height:var(--leading-lg)] exact:[&_p]:[margin:var(--space-1)_0_0] exact:[&_p]:[color:var(--ink-muted)] exact:[&_p]:[font-size:var(--text-sm)] exact:[&_p]:[line-height:var(--leading-base)]"}>
        <h2 id={titleId}>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      <div className={"ui-chart-card-actions exact:flex exact:items-center exact:[justify-content:flex-end] exact:[gap:var(--space-3)] exact:flex-wrap"}>
        {action}
        {hasTable && <div className={"ui-chart-view-toggle exact:inline-flex exact:[flex:0_0_auto] exact:items-center exact:[gap:var(--space-0-5)] exact:[padding:var(--space-0-5)] exact:[border-radius:var(--radius-md)] exact:[background:var(--grey-100)] exact:[&_button]:[min-height:var(--space-8)] exact:[&_button]:[padding:0_var(--space-3)] exact:[&_button]:[border:0] exact:[&_button]:[border-radius:calc(var(--radius-md)_-_2px)] exact:[&_button]:[background:transparent] exact:[&_button]:[color:var(--ink-muted)] exact:[&_button]:[font:inherit] exact:[&_button]:[font-size:var(--text-xs)] exact:[&_button]:[font-weight:var(--weight-medium)] exact:[&_button]:cursor-pointer exact:[&_button[aria-pressed='true']]:[background:var(--surface)] exact:[&_button[aria-pressed='true']]:[color:var(--ink)] exact:[&_button[aria-pressed='true']]:[box-shadow:var(--shadow-card)] exact:[&_button:focus-visible]:[outline:var(--focus-width)_solid_var(--focus-color)] exact:[&_button:focus-visible]:[outline-offset:var(--focus-offset)]"} role="group" aria-label={`${title} view`}>
          <button type="button" aria-pressed={view === "chart"} onClick={() => setView("chart")}>Chart</button>
          <button type="button" aria-pressed={view === "table"} onClick={() => setView("table")}>Table</button>
        </div>}
      </div>
    </header>
    <div className={"ui-chart-card-content exact:[min-width:0]"} aria-labelledby={titleId}>
      {loading ? <div className={"ui-chart-skeleton exact:grid exact:[gap:var(--space-3)]"} role="status" aria-label={loadingLabel || `Loading ${title}`}>
        <Skeleton className={"ui-chart-skeleton-plot exact:[height:15rem] exact:[border-radius:var(--radius-md)]"} />
        <Skeleton className={"ui-chart-skeleton-axis exact:[width:72%] exact:[height:var(--space-4)] exact:[margin-inline:auto]"} />
      </div> : empty ? <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} /> : view === "table" && hasTable ? <DataTable
        caption={table.caption || `${title} data`}
        columns={table.columns}
        rows={table.rows || []}
        getRowKey={table.getRowKey}
        emptyMessage={emptyTitle}
        emptyDescription={emptyDescription}
        className={"ui-chart-data-table exact:[min-width:0]"}
      /> : <div className={"ui-chart-plot exact:[min-width:0]"} role="region" aria-label={label}>{children}</div>}
    </div>
  </Card>;
}
