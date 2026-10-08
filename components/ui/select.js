export default function Select({ label, id, hint, error, children, className = "", ...props }) {
  const selectId = id || props.name;
  return (
    <div className="ui-field">
      {label && <label className="ui-label" htmlFor={selectId}>{label}</label>}
      <select id={selectId} className={`ui-select ${error ? "ui-input-error" : ""} ${className}`.trim()} aria-invalid={error ? "true" : undefined} aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined} {...props}>{children}</select>
      {error ? <span className="ui-field-error" id={`${selectId}-error`}>{error}</span> : hint ? <span className="ui-field-hint" id={`${selectId}-hint`}>{hint}</span> : null}
    </div>
  );
}
