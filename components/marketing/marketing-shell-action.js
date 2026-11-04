import Link from "next/link";
import { cn } from "../../lib/cn.js";
const variants = {
  primary: "border-transparent bg-[#4F46E5] text-white hover:bg-[#4338CA]",
  secondary: "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
  tertiary: "border-transparent bg-transparent text-slate-700 hover:bg-slate-50 hover:text-indigo-600",
};
export default function MarketingShellAction({ variant = "primary", className = "", ...props }) {
  return <Link {...props} className={cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold leading-6 transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600", variants[variant] || variants.primary, className)} />;
}
