import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import Card from "./card";
import Skeleton from "./skeleton";

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

  return <svg className="ui-stat-sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label || "Recent trend"}>
    <polyline points={points.map(({ x, y }) => `${x},${y}`).join(" ")} />
    <circle className="ui-stat-sparkline-ring" cx={last.x} cy={last.y} r="4" />
    <circle className="ui-stat-sparkline-point" cx={last.x} cy={last.y} r="2" />
  </svg>;
}

export default function StatCard({ label, value, icon, trend, sparkline, sparklineLabel, description, loading = false, className = "", ...props }) {
  const TrendIcon = trend?.direction === "up" ? ArrowUpRight : trend?.direction === "down" ? ArrowDownRight : Minus;
  const tone = ["success", "warning", "error"].includes(trend?.tone) ? trend.tone : "neutral";
  const hasSparkline = Array.isArray(sparkline) && sparkline.length >= 2 && sparkline.every(Number.isFinite);
  return <Card {...props} className={`ui-stat-card ${className}`.trim()} aria-busy={loading || undefined}>
    <div className="ui-stat-heading"><p>{label}</p>{icon && <span className="ui-stat-icon" aria-hidden="true">{icon}</span>}</div>
    {loading ? <><Skeleton className="ui-stat-skeleton" /><span className="sr-only">Loading {label}</span></> : <p className="ui-stat-value">{value ?? "—"}</p>}
    {!loading && (trend?.label || hasSparkline) && <div className="ui-stat-footer">
      {trend?.label && <p className={`ui-stat-trend ui-trend-${tone}`}><TrendIcon size={14} aria-hidden="true" />{trend.label}</p>}
      {hasSparkline && <Sparkline values={sparkline} label={sparklineLabel} />}
    </div>}
    {description && <p className="ui-stat-description">{description}</p>}
  </Card>;
}
