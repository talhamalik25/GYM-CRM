import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function PageHeader({ eyebrow, title, description, actions, breadcrumbs = [], className = "" }) {
  return <header className={`ui-page-header ${className}`.trim()}>
    <div className="ui-page-intro">
      {breadcrumbs.length > 0 && <nav aria-label="Breadcrumb"><ol className="ui-breadcrumbs">{breadcrumbs.map((item, index) => <li key={item.href || `${item.label}-${index}`}>
        {index > 0 && <ChevronRight size={14} aria-hidden="true" />}
        {item.href && index < breadcrumbs.length - 1 ? <Link href={item.href}>{item.label}</Link> : <span aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}>{item.label}</span>}
      </li>)}</ol></nav>}
      {eyebrow && <p className="ui-page-eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>{description && <p className="ui-page-description">{description}</p>}
    </div>
    {actions && <div className="ui-page-actions">{actions}</div>}
  </header>;
}
