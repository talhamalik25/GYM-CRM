import Badge from "./badge";

const tones = {
  active: "success", paid: "success", present: "success", current: "success",
  expired: "error", overdue: "error", absent: "error", suspended: "error",
  pending: "warning", partial: "warning", "partially paid": "warning",
  expiring: "warning", "expiring soon": "warning", "on leave": "warning",
  upcoming: "info", completed: "info", inactive: "neutral", cancelled: "neutral",
};

export default function StatusPill({ status, children, className = "", ...props }) {
  const label = children ?? status ?? "Unknown";
  const key = String(status ?? children ?? "").trim().toLowerCase().replaceAll("_", " ");
  return <Badge {...props} tone={tones[key] || "neutral"} className={`ui-status-pill exact:[gap:var(--space-1-5)] ${className}`.trim()}>
    <span className={"ui-status-dot exact:[width:var(--space-1-5)] exact:[height:var(--space-1-5)] exact:[border-radius:var(--radius-pill)] exact:[background:currentColor]"} aria-hidden="true" />{label}
  </Badge>;
}
