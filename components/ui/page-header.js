import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function PageHeader({ eyebrow, title, description, actions, breadcrumbs = [], className = "" }) {
  return <header className={`ui-page-header exact:flex exact:[align-items:flex-end] exact:[justify-content:space-between] exact:[gap:20px] exact:[margin-bottom:24px] exact:[&_h1]:[margin:0] exact:[&_h1]:[color:var(--ink)] exact:[&_h1]:[font-size:var(--type-page)] exact:[&_h1]:[font-weight:700] exact:[&_h1]:[letter-spacing:var(--tracking-tight)] exact:[&_h1]:[line-height:1.25] exact:at-most-600:flex-col exact:at-most-760:[align-items:flex-start] exact:at-most-760:flex-col exact:at-most-760:[gap:13px] exact:at-most-760:[margin-bottom:20px] ${className}`.trim()}>
    <div className="ui-page-intro">
      {breadcrumbs.length > 0 && <nav aria-label="Breadcrumb"><ol className={"ui-breadcrumbs exact:flex exact:flex-wrap exact:items-center exact:[gap:var(--space-2)] exact:[list-style:none] exact:[padding:0] exact:[margin:0_0_var(--space-3)] exact:[color:var(--ink-muted)] exact:[font-size:var(--text-xs)] exact:[&_li]:inline-flex exact:[&_li]:items-center exact:[&_li]:[gap:var(--space-2)] exact:[&_a:hover]:[color:var(--brand)] exact:[&_a:hover]:[text-decoration:underline]"}>{breadcrumbs.map((item, index) => <li key={item.href || `${item.label}-${index}`}>
        {index > 0 && <ChevronRight size={14} aria-hidden="true" />}
        {item.href && index < breadcrumbs.length - 1 ? <Link href={item.href}>{item.label}</Link> : <span aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}>{item.label}</span>}
      </li>)}</ol></nav>}
      {eyebrow && <p className={"ui-page-eyebrow exact:[margin:0_0_8px] exact:[color:var(--brand)] exact:[font-size:10px] exact:[font-weight:700] exact:[letter-spacing:.13em] exact:[line-height:1.4] exact:[text-transform:uppercase]"}>{eyebrow}</p>}
      <h1>{title}</h1>{description && <p className={"ui-page-description exact:[max-width:680px] exact:[margin:8px_0_0] exact:[line-height:1.55] exact:[font-size:var(--type-body)] exact:[color:var(--ink-subtle)]"}>{description}</p>}
    </div>
    {actions && <div className={"ui-page-actions exact:flex exact:items-center exact:[justify-content:flex-end] exact:[gap:8px] exact:flex-wrap exact:at-most-600:[width:100%] exact:at-most-760:[width:100%] exact:at-most-760:[justify-content:flex-start]"}>{actions}</div>}
  </header>;
}
