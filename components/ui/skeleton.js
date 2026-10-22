export default function Skeleton({ as: Component = "span", className = "", ...props }) {
  return <Component {...props} className={`ui-skeleton ${className}`.trim()} aria-hidden="true" />;
}

export function PageSkeleton({ label = "Loading page" }) {
  return <div className="ui-page-skeleton" role="status" aria-label={label}>
    <span className="sr-only">{label}</span>
    <Skeleton className="ui-skeleton-title" />
    <Skeleton className="ui-skeleton-description" />
    <div className="ui-skeleton-stats">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="ui-skeleton-card" />)}</div>
    <Skeleton className="ui-skeleton-content" />
  </div>;
}
