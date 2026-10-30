"use client";

import { useId } from "react";

export function useField({ id, hint, error, "aria-describedby": describedBy, "aria-invalid": invalid }) {
  const generatedId = useId();
  const fieldId = id || `field-${generatedId}`;
  return {
    id: fieldId,
    "aria-invalid": error ? true : invalid,
    "aria-describedby": [describedBy, hint && `${fieldId}-hint`, error && `${fieldId}-error`].filter(Boolean).join(" ") || undefined,
  };
}

export default function Field({ id, label, hint, error, children, className = "" }) {
  return <div className={`ui-field exact:grid exact:[min-width:0] exact:[gap:var(--space-1-5)] ${className}`.trim()}>
    {label && <label className={"ui-label exact:[color:var(--ink)] exact:[font-size:13px] exact:[font-weight:600]"} htmlFor={id}>{label}</label>}
    {children}
    {hint && <span className={"ui-field-hint exact:[font-size:12px] exact:[color:var(--ink-subtle)]"} id={`${id}-hint`}>{hint}</span>}
    {error && <span className={"ui-field-error exact:[font-size:12px] exact:[color:var(--error)]"} id={`${id}-error`} role="alert">{error}</span>}
  </div>;
}
