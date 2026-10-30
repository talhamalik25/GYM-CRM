import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import Card from "./card";
import Skeleton from "./skeleton";
const trendClasses = { success: "ui-trend-success exact:[color:var(--success)] exact:[background:var(--success-soft)]", warning: "ui-trend-warning exact:[color:var(--warning)] exact:[background:var(--warning-soft)]", error: "ui-trend-error exact:[color:var(--danger)] exact:[background:var(--danger-soft)]", neutral: "ui-trend-neutral exact:[color:var(--ink-muted)] exact:[background:var(--grey-100)]" };

function Sparkline({ values, label }) {
  if (!Array.isArray(values) || values.length < 2 || !values.every(Number.isFinite)) return null;
  const width = 96;
  const height = 32;
  const inset = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((value, index) => ({
    x: inset + (index / (values.length - 1)) * (width - inset * 2),
    y: height - inset - ((value - min) / range) * (height - inset * 2),
  }));
  const last = points.at(-1);

  return <svg className={"ui-stat-sparkline exact:block exact:[flex:0_0_96px] exact:[width:96px] exact:[height:32px] exact:[overflow:visible] exact:[&_polyline]:[fill:none] exact:[&_polyline]:[stroke:var(--chart-sparkline)] exact:[&_polyline]:[stroke-width:2] exact:[&_polyline]:[stroke-linecap:round] exact:[&_polyline]:[stroke-linejoin:round]"} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label || "Recent trend"}>
    <polyline points={points.map(({ x, y }) => `${x},${y}`).join(" ")} />
    <circle className={"ui-stat-sparkline-ring exact:[fill:var(--surface)]"} cx={last.x} cy={last.y} r="4" />
    <circle className={"ui-stat-sparkline-point exact:[fill:var(--brand)]"} cx={last.x} cy={last.y} r="2" />
  </svg>;
}

export default function StatCard({ label, value, icon, trend, sparkline, sparklineLabel, description, loading = false, className = "", ...props }) {
  const TrendIcon = trend?.direction === "up" ? ArrowUpRight : trend?.direction === "down" ? ArrowDownRight : Minus;
  const tone = ["success", "warning", "error"].includes(trend?.tone) ? trend.tone : "neutral";
  const hasSparkline = Array.isArray(sparkline) && sparkline.length >= 2 && sparkline.every(Number.isFinite);
  return <Card {...props} className={`ui-stat-card exact:[min-width:0] exact:[padding:var(--space-6)] exact:at-most-768:[padding:var(--space-4)] ${className}`.trim()} aria-busy={loading || undefined}>
    <div className={"ui-stat-heading exact:flex exact:[justify-content:space-between] exact:items-center exact:[gap:var(--space-3)] exact:[&_p]:[margin:0] exact:[&_p]:[color:var(--ink-muted)] exact:[&_p]:[font-size:var(--text-sm)]"}><p>{label}</p>{icon && <span className={"ui-stat-icon exact:grid exact:[place-items:center] exact:[padding:var(--space-2)] exact:[border-radius:var(--radius-md)] exact:[background:var(--brand-soft)] exact:[color:var(--brand-soft-text)] exact:[&_svg]:[width:var(--space-5)] exact:[&_svg]:[height:var(--space-5)]"} aria-hidden="true">{icon}</span>}</div>
    {loading ? <><Skeleton className={"ui-stat-skeleton exact:[width:60%] exact:[height:var(--space-9)] exact:[margin-block:var(--space-4)]"} /><span className="sr-only">Loading {label}</span></> : <p className={"ui-stat-value exact:[margin:var(--space-4)_0] exact:[line-height:var(--leading-3xl)] exact:[overflow-wrap:anywhere] exact:[font-size:var(--type-stat)] exact:[font-weight:700] exact:[letter-spacing:var(--tracking-tight)]"}>{value ?? "—"}</p>}
    {!loading && (trend?.label || hasSparkline) && <div className={"ui-stat-footer exact:flex exact:[min-height:var(--space-8)] exact:items-center exact:[justify-content:space-between] exact:[gap:var(--space-2)]"}>
      {trend?.label && <p className={`ui-stat-trend exact:inline-flex exact:items-center exact:[gap:var(--space-1)] exact:[max-width:100%] exact:[margin:0] exact:[padding:var(--space-1)_var(--space-2)] exact:[border-radius:var(--radius-pill)] exact:[font-size:var(--text-xs)] exact:[line-height:var(--leading-sm)] ${trendClasses[tone]}`}><TrendIcon size={14} aria-hidden="true" />{trend.label}</p>}
      {hasSparkline && <Sparkline values={sparkline} label={sparklineLabel} />}
    </div>}
    {description && <p className={"ui-stat-description exact:[margin:0] exact:[color:var(--ink-muted)] exact:[font-size:var(--text-sm)]"}>{description}</p>}
  </Card>;
}
