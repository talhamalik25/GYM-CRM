export default function EmptyState({ title, description, action, icon, className = "" }) {
  return <div className={`ui-empty-state ${className}`.trim()}>{icon && <div className="ui-empty-icon" aria-hidden="true">{icon}</div>}<h3>{title}</h3>{description && <p>{description}</p>}{action && <div className="ui-empty-action">{action}</div>}</div>;
}
