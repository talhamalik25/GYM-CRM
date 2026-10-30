export default function Skeleton({ as: Component = "span", className = "", ...props }) {
  return <Component {...props} className={`ui-skeleton exact:block exact:[width:100%] exact:[height:var(--space-4)] exact:[border-radius:var(--radius-sm)] exact:[background:var(--grey-200)] exact:[animation:ui-skeleton-pulse_1.6s_ease-in-out_infinite] exact:less-motion:[animation:none] ${className}`.trim()} aria-hidden="true" />;
}

export function PageSkeleton({ label = "Loading page" }) {
  return <div className={"ui-page-skeleton exact:grid exact:[gap:var(--space-4)]"} role="status" aria-label={label}>
    <span className="sr-only">{label}</span>
    <Skeleton className={"ui-skeleton-title exact:[width:min(60%,_20rem)] exact:[height:var(--space-8)]"} />
    <Skeleton className={"ui-skeleton-description exact:[width:min(85%,_32rem)]"} />
    <div className={"ui-skeleton-stats exact:grid exact:[grid-template-columns:repeat(4,_minmax(0,_1fr))] exact:[gap:var(--space-4)] exact:[margin-block:var(--space-4)] exact:at-most-768:[grid-template-columns:repeat(2,_minmax(0,_1fr))]"}>{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className={"ui-skeleton-card exact:[height:9rem] exact:[border-radius:var(--radius-lg)]"} />)}</div>
    <Skeleton className={"ui-skeleton-content exact:[height:18rem] exact:[border-radius:var(--radius-lg)]"} />
  </div>;
}
