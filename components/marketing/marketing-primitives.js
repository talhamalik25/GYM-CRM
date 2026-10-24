import Link from "next/link";

const buttonStyles = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-950/10",
  outline: "border border-slate-300 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50",
  quiet: "text-slate-700 hover:bg-slate-100",
  inverse: "border border-white/25 bg-white/5 text-white hover:bg-white/10",
};

export function MarketingButton({ href, variant = "primary", className = "", children, ...props }) {
  const classes = `inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${buttonStyles[variant] || buttonStyles.primary} ${className}`.trim();
  if (href) return <Link href={href} className={classes} {...props}>{children}</Link>;
  return <button className={classes} {...props}>{children}</button>;
}

export function MarketingPill({ children, className = "" }) {
  return <span className={`inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[11px] font-semibold text-indigo-800 ${className}`.trim()}>{children}</span>;
}

export function MarketingSection({ as: Element = "section", id, className = "", containerClassName = "", children, ...props }) {
  return <Element id={id} className={`px-5 py-16 sm:py-20 lg:py-24 ${className}`.trim()} {...props}>
    <div className={`mx-auto w-full max-w-6xl ${containerClassName}`.trim()}>{children}</div>
  </Element>;
}

export function MarketingPreviewCard({ children, className = "", label = "Sample data", title = "Fitivo preview" }) {
  return <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,.10)] ${className}`.trim()}>
    <div className="flex h-9 items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-3" aria-label={title}>
      <span className="size-2 rounded-full bg-slate-300" aria-hidden="true" />
      <span className="size-2 rounded-full bg-slate-300" aria-hidden="true" />
      <span className="size-2 rounded-full bg-slate-300" aria-hidden="true" />
      <span className="ml-auto text-[9px] font-medium text-slate-500">{title}</span>
    </div>
    {children}
    <div className="flex items-center gap-2 border-t border-slate-100 bg-white px-3 py-2 text-[9px] text-slate-500">
      <span className="size-1.5 rounded-full bg-indigo-500" aria-hidden="true" />{label}
    </div>
  </div>;
}
