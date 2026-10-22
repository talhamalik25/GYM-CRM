import { CircleAlert } from "lucide-react";
import Button from "./button";

export default function ErrorState({ title = "Something went wrong", description, onRetry, loading = false, className = "" }) {
  return <div className={`ui-error-state ${className}`.trim()} role="alert">
    <CircleAlert size={20} aria-hidden="true" />
    <div><h3>{title}</h3>{description && <p>{description}</p>}</div>
    {onRetry && <Button type="button" variant="secondary" onClick={onRetry} loading={loading} loadingLabel="Retrying…">Try again</Button>}
  </div>;
}
