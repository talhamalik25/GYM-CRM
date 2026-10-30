"use client";

import Field, { useField } from "./field";
import Control from "./control.js";

export default function Textarea({ label, id, hint, error, className = "", fieldClassName = "", rows = 4, ...props }) {
  const field = useField({ ...props, id, hint, error });
  return <Field {...field} label={label} hint={hint} error={error} className={fieldClassName}>
    <Control as="textarea" {...props} {...field} rows={rows} className={` ui-textarea exact:block exact:[min-height:var(--space-24)] exact:[padding:var(--space-3)] exact:[resize:vertical] exact:[line-height:var(--leading-body)] ${error ? "ui-input-error exact:[border-color:var(--error)]!" : ""} ${className}`.trim()} />
  </Field>;
}
