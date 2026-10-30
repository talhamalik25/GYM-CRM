"use client";

import { CircleCheck, CircleAlert, Info, X } from "lucide-react";
const toneClasses = { success: "ui-toast-success exact:[color:var(--success)]", error: "ui-toast-error exact:[color:var(--danger)]", warning: "ui-toast-warning exact:[color:var(--warning)]", info: "ui-toast-info exact:[color:var(--info)]" };

// The caller owns messages and dismissal. No timers or new notification source.
export default function Toast({ title, description, tone = "info", onDismiss }) {
  const variant = ["success", "error", "warning", "info"].includes(tone) ? tone : "info";
  const Icon = variant === "success" ? CircleCheck : variant === "info" ? Info : CircleAlert;
  return <div className={`ui-toast exact:flex exact:[align-items:flex-start] exact:[gap:var(--space-3)] exact:[padding:var(--space-4)] exact:[border:1px_solid_var(--line)] exact:[border-left:var(--space-1)_solid_currentColor] exact:[border-radius:var(--radius-md)] exact:[background:var(--surface)] exact:[box-shadow:var(--shadow-md)] exact:[&>svg]:[flex-shrink:0] exact:[&>div]:[flex:1] exact:[&>div]:[min-width:0] exact:[&>div]:[color:var(--ink)] exact:[&>div]:[font-size:var(--text-sm)] exact:[&>div]:[overflow-wrap:anywhere] exact:[&_p]:[margin:var(--space-1)_0_0] exact:[&_p]:[color:var(--ink-muted)] ${toneClasses[variant]}`}>
    <Icon size={20} aria-hidden="true" />
    <div role={variant === "error" ? "alert" : "status"} aria-atomic="true"><strong>{title}</strong>{description && <p>{description}</p>}</div>
    {onDismiss && <button type="button" className={"ui-icon-button exact:[&:focus-visible]:[outline:var(--focus-width)_solid_var(--focus-color)] exact:[&:focus-visible]:[outline-offset:var(--focus-offset)] exact:grid exact:[place-items:center] exact:[width:32px] exact:[height:32px] exact:[padding:0] exact:[border:1px_solid_var(--line)] exact:[border-radius:var(--radius-md)] exact:[background:var(--surface)] exact:[color:var(--ink-muted)] exact:[transition:background_0.15s,_color_0.15s] exact:[&:hover]:[background:var(--canvas)] exact:[&:hover]:[color:var(--ink)]"} onClick={onDismiss} aria-label="Dismiss notification"><X size={16} aria-hidden="true" /></button>}
  </div>;
}

export function ToastRegion({ children, label = "Notifications" }) {
  return <section className={"ui-toast-region exact:fixed exact:[bottom:max(var(--space-6),_env(safe-area-inset-bottom))] exact:[right:var(--space-6)] exact:[z-index:70] exact:grid exact:[gap:var(--space-3)] exact:[width:min(26rem,_calc(100vw_-_var(--space-12)))]"} aria-label={label}>{children}</section>;
}
