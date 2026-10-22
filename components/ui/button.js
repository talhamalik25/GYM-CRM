import Link from "next/link";
import { LoaderCircle } from "lucide-react";

const variants = {
  primary: "ui-button-primary",
  secondary: "ui-button-secondary",
  ghost: "ui-button-ghost",
  danger: "ui-button-danger",
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
  const classes = `ui-button ${variants[variant] || variants.primary} ui-button-${["sm", "md", "lg"].includes(size) ? size : "md"} ${className}`.trim();
  const content = <>{loading && <LoaderCircle size={16} className="ui-spinner" aria-hidden="true" />}{loading && loadingLabel ? loadingLabel : children}</>;
  const busy = loading || props["aria-busy"] || undefined;
  if (href && unavailable) return <span {...props} className={classes} role="link" aria-disabled="true" aria-busy={busy}>{content}</span>;
  if (href) return <Link {...props} className={classes} href={href} onClick={onClick} onKeyDown={onKeyDown}>{content}</Link>;
  return <button {...props} className={classes} disabled={unavailable} aria-busy={busy} onClick={onClick} onKeyDown={onKeyDown}>{content}</button>;
}
