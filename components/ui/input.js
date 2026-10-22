"use client";

import Field, { useField } from "./field";

export default function Input({ label, id, hint, error, className = "", fieldClassName = "", ...props }) {
  const field = useField({ ...props, id, hint, error });
  return <Field {...field} label={label} hint={hint} error={error} className={fieldClassName}>
    <input {...props} {...field} className={`ui-input ${error ? "ui-input-error" : ""} ${className}`.trim()} />
  </Field>;
}
