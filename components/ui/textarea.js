"use client";

import Field, { useField } from "./field";

export default function Textarea({ label, id, hint, error, className = "", fieldClassName = "", rows = 4, ...props }) {
  const field = useField({ ...props, id, hint, error });
  return <Field {...field} label={label} hint={hint} error={error} className={fieldClassName}>
    <textarea {...props} {...field} rows={rows} className={`ui-input ui-textarea ${error ? "ui-input-error" : ""} ${className}`.trim()} />
  </Field>;
}
