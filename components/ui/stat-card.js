import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import Card from "./card";
import Skeleton from "./skeleton";

export default function StatCard({ label, value, icon, trend, description, loading = false, className = "", ...props }) {
  const TrendIcon = trend?.direction === "up" ? ArrowUpRight : trend?.direction === "down" ? ArrowDownRight : Minus;
  const tone = ["success", "warning", "error"].includes(trend?.tone) ? trend.tone : "neutral";
  return <Card {...props} className={`ui-stat-card ${className}`.trim()} aria-busy={loading || undefined}>
    <div className="ui-stat-heading"><p>{label}</p>{icon && <span className="ui-stat-icon" aria-hidden="true">{icon}</span>}</div>
    {loading ? <><Skeleton className="ui-stat-skeleton" /><span className="sr-only">Loading {label}</span></> : <p className="ui-stat-value">{value ?? "—"}</p>}
    {!loading && trend?.label && <p className={`ui-stat-trend ui-trend-${tone}`}><TrendIcon size={16} aria-hidden="true" />{trend.label}</p>}
    {description && <p className="ui-stat-description">{description}</p>}
  </Card>;
}
