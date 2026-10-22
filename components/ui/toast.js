"use client";

import { CircleCheck, CircleAlert, Info, X } from "lucide-react";

// The caller owns messages and dismissal. No timers or new notification source.
export default function Toast({ title, description, tone = "info", onDismiss }) {
  const variant = ["success", "error", "warning", "info"].includes(tone) ? tone : "info";
  const Icon = variant === "success" ? CircleCheck : variant === "info" ? Info : CircleAlert;
  return <div className={`ui-toast ui-toast-${variant}`}>
    <Icon size={20} aria-hidden="true" />
    <div role={variant === "error" ? "alert" : "status"} aria-atomic="true"><strong>{title}</strong>{description && <p>{description}</p>}</div>
    {onDismiss && <button type="button" className="ui-icon-button" onClick={onDismiss} aria-label="Dismiss notification"><X size={16} aria-hidden="true" /></button>}
  </div>;
}

export function ToastRegion({ children, label = "Notifications" }) {
  return <section className="ui-toast-region" aria-label={label}>{children}</section>;
}
