export default function PageHeader({ eyebrow, title, description, actions, className = "" }) {
  return <header className={`ui-page-header ${className}`.trim()}><div>{eyebrow && <p className="ui-page-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="ui-page-description">{description}</p>}</div>{actions && <div className="ui-page-actions">{actions}</div>}</header>;
}
