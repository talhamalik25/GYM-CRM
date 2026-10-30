import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { cn } from "../../lib/cn.js";

const sizes = { sm: "ui-button-sm exact:[&]:[min-height:32px] exact:[padding-inline:11px] exact:[font-size:12px]", md: "ui-button-md exact:[min-height:38px]", lg: "ui-button-lg exact:[min-height:44px] exact:[padding-inline:18px] exact:[font-size:14px]" };

const variants = {
  primary: "ui-button-primary exact:[background:var(--brand)] exact:[color:var(--on-brand)] exact:[box-shadow:none] exact:[&:hover:not(:disabled)]:[background:var(--brand-hover)]",
  secondary: "ui-button-secondary exact:[color:var(--ink)] exact:[&]:[border-color:var(--line-strong)] exact:[background:var(--surface)] exact:[&:hover:not(:disabled)]:[background:var(--canvas)] exact:[&:hover:not(:disabled)]:[border-color:var(--line-control)]",
  ghost: "ui-button-ghost exact:[color:var(--ink-muted)] exact:[background:transparent] exact:[&:hover:not(:disabled)]:[background:var(--canvas)] exact:[&:hover:not(:disabled)]:[color:var(--ink)]",
  danger: "ui-button-danger exact:[color:var(--ink-inverse)] exact:[background:var(--error)] exact:[&:hover:not(:disabled)]:[background:var(--danger-hover)]",
};

export default function Button({
  variant = "primary",
  size = "md",
  href,
  className = "",
  children,
  loading = false,
  loadingLabel,
  disabled = false,
  onClick,
  onKeyDown,
  ...props
}) {
  const unavailable = disabled || loading;
  const classes = cn("ui-button exact:inline-flex exact:items-center exact:justify-center exact:[gap:7px] exact:[min-height:38px] exact:[border:1px_solid_transparent] exact:[padding:0_14px] exact:[font-weight:600] exact:[line-height:1] exact:[white-space:nowrap] exact:cursor-pointer exact:[transition:background_0.15s,_border-color_0.15s,_color_0.15s,_box-shadow_0.15s] exact:[border-radius:var(--radius-input)] exact:[font-size:var(--type-body)] exact:[&:focus-visible]:[outline:var(--focus-width)_solid_var(--focus-color)] exact:[&:focus-visible]:[outline-offset:var(--focus-offset)] exact:[&:disabled]:[opacity:0.5] exact:[&:disabled]:[cursor:not-allowed] exact:[&:disabled]:[box-shadow:none] exact:[&[aria-disabled='true']]:[opacity:0.5] exact:[&[aria-disabled='true']]:[cursor:not-allowed] exact:[&[aria-disabled='true']]:[box-shadow:none]", variants[variant] || variants.primary, sizes[["sm", "md", "lg"].includes(size) ? size : "md"], className);
  const content = <>{loading && <LoaderCircle size={16} className={"ui-spinner exact:[animation:ui-spin_.8s_linear_infinite] exact:less-motion:[animation:none]"} aria-hidden="true" />}{loading && loadingLabel ? loadingLabel : children}</>;
  const busy = loading || props["aria-busy"] || undefined;
  if (href && unavailable) return <span {...props} className={classes} role="link" aria-disabled="true" aria-busy={busy}>{content}</span>;
  if (href) return <Link {...props} className={classes} href={href} onClick={onClick} onKeyDown={onKeyDown}>{content}</Link>;
  return <button {...props} className={classes} disabled={unavailable} aria-busy={busy} onClick={onClick} onKeyDown={onKeyDown}>{content}</button>;
}
