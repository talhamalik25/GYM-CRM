export default function Input({ label, id, hint, error, className = "", ...props }) {
  const inputId = id || props.name;
  return (
    <div className="ui-field">
      {label && <label className="ui-label" htmlFor={inputId}>{label}</label>}
      <input id={inputId} className={`ui-input ${error ? "ui-input-error" : ""} ${className}`.trim()} aria-invalid={error ? "true" : undefined} aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined} {...props} />
      {error ? <span className="ui-field-error" id={`${inputId}-error`}>{error}</span> : hint ? <span className="ui-field-hint" id={`${inputId}-hint`}>{hint}</span> : null}
    </div>
  );
}
