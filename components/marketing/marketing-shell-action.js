import Link from "next/link";
import { cn } from "../../lib/cn.js";
const variants = {
  primary: "border-transparent bg-[#4F46E5] text-white! shadow-sm shadow-indigo-600/20 hover:bg-[#4338CA] [&_svg]:transition-transform [&_svg]:duration-150 hover:[&_svg]:translate-x-0.5 motion-reduce:[&_svg]:transition-none motion-reduce:hover:[&_svg]:translate-x-0",
  secondary: "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
  tertiary: "border-transparent bg-transparent text-slate-700 hover:bg-slate-50 hover:text-indigo-600",
};
export default function MarketingShellAction({ variant = "primary", className = "", ...props }) {
  return <Link {...props} className={cn("inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[10px] border px-5 py-2 whitespace-nowrap text-sm font-semibold leading-6 transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600", variants[variant] || variants.primary, className)} />;
}
