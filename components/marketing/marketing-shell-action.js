import Link from "next/link";
import { cn } from "../../lib/cn.js";

const variants = {
  primary: "m-marketing-shell-primary exact:[border-radius:9px] exact:inline-flex exact:items-center exact:justify-center exact:[gap:10px] exact:[min-height:44px] exact:[padding:11px_16px] exact:[font-size:12px] exact:[line-height:1.5] exact:[font-weight:600] exact:[transition:background_180ms,_box-shadow_180ms] exact:[background:var(--shell-brand)] exact:[color:white] exact:[border:1px_solid_var(--shell-brand)] exact:[box-shadow:0_3px_8px_#4f46e518] exact:[&:hover]:[background:#4338ca]",
  secondary: "m-marketing-shell-secondary exact:[border-radius:9px] exact:inline-flex exact:items-center exact:justify-center exact:[gap:10px] exact:[min-height:44px] exact:[padding:11px_16px] exact:[font-size:12px] exact:[line-height:1.5] exact:[font-weight:600] exact:[transition:background_180ms,_box-shadow_180ms] exact:[color:var(--shell-ink)] exact:[border:1px_solid_var(--shell-line)] exact:[background:white] exact:[&:hover]:[background:#f6f5ff]",
};

export default function MarketingShellAction({ variant = "primary", className = "", ...props }) {
  return <Link {...props} className={cn(variants[variant] || variants.primary, className)} />;
}
