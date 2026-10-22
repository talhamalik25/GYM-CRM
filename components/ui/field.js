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
  return <div className={`ui-field ${className}`.trim()}>
    {label && <label className="ui-label" htmlFor={id}>{label}</label>}
    {children}
    {hint && <span className="ui-field-hint" id={`${id}-hint`}>{hint}</span>}
    {error && <span className="ui-field-error" id={`${id}-error`} role="alert">{error}</span>}
  </div>;
}
