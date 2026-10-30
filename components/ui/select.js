"use client";

import Field, { useField } from "./field";
import Control from "./control.js";

export default function Select({ label, id, hint, error, children, className = "", fieldClassName = "", ...props }) {
  const field = useField({ ...props, id, hint, error });
  return <Field {...field} label={label} hint={hint} error={error} className={fieldClassName}>
    <Control as="select" {...props} {...field} className={` ${error ? "ui-input-error exact:[border-color:var(--error)]!" : ""} ${className}`.trim()}>{children}</Control>
  </Field>;
}
