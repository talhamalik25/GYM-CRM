import { CircleAlert } from "lucide-react";
import Button from "./button";

export default function ErrorState({ title = "Something went wrong", description, onRetry, loading = false, className = "" }) {
  return <div className={`ui-error-state exact:flex exact:[align-items:flex-start] exact:[gap:var(--space-3)] exact:[padding:var(--space-5)] exact:[border:1px_solid_var(--danger)] exact:[border-radius:var(--radius-lg)] exact:[background:var(--danger-soft)] exact:[color:var(--danger)] exact:[&>svg]:[flex-shrink:0] exact:[&>div]:[flex:1] exact:[&>div]:[min-width:0] exact:[&_h3]:[margin:0] exact:[&_h3]:[font-size:var(--text-sm)] exact:[&_p]:[margin:var(--space-1)_0_0] exact:[&_p]:[font-size:var(--text-sm)] exact:at-most-768:flex-wrap ${className}`.trim()} role="alert">
    <CircleAlert size={20} aria-hidden="true" />
    <div><h3>{title}</h3>{description && <p>{description}</p>}</div>
    {onRetry && <Button type="button" variant="secondary" onClick={onRetry} loading={loading} loadingLabel="Retrying…">Try again</Button>}
  </div>;
}
