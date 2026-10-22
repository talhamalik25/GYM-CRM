"use client";

import Field, { useField } from "./field";

export default function Select({ label, id, hint, error, children, className = "", fieldClassName = "", ...props }) {
  const field = useField({ ...props, id, hint, error });
  return <Field {...field} label={label} hint={hint} error={error} className={fieldClassName}>
    <select {...props} {...field} className={`ui-select ${error ? "ui-input-error" : ""} ${className}`.trim()}>{children}</select>
  </Field>;
}
