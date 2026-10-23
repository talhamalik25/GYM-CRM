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

  return <Card className={`ui-chart-card ${className}`.trim()} aria-busy={loading || undefined}>
    <header className="ui-chart-card-header">
      <div className="ui-chart-card-heading">
        <h2 id={titleId}>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      <div className="ui-chart-card-actions">
        {action}
        {hasTable && <div className="ui-chart-view-toggle" role="group" aria-label={`${title} view`}>
          <button type="button" aria-pressed={view === "chart"} onClick={() => setView("chart")}>Chart</button>
          <button type="button" aria-pressed={view === "table"} onClick={() => setView("table")}>Table</button>
        </div>}
      </div>
    </header>
    <div className="ui-chart-card-content" aria-labelledby={titleId}>
      {loading ? <div className="ui-chart-skeleton" role="status" aria-label={loadingLabel || `Loading ${title}`}>
        <Skeleton className="ui-chart-skeleton-plot" />
        <Skeleton className="ui-chart-skeleton-axis" />
      </div> : empty ? <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} /> : view === "table" && hasTable ? <DataTable
        caption={table.caption || `${title} data`}
        columns={table.columns}
        rows={table.rows || []}
        getRowKey={table.getRowKey}
        emptyMessage={emptyTitle}
        emptyDescription={emptyDescription}
        className="ui-chart-data-table"
      /> : <div className="ui-chart-plot" role="region" aria-label={label}>{children}</div>}
    </div>
  </Card>;
}
