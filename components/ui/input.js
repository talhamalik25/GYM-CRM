"use client";

import Field, { useField } from "./field";
import Control from "./control.js";

export default function Input({ label, id, hint, error, className = "", fieldClassName = "", ...props }) {
  const field = useField({ ...props, id, hint, error });
  return <Field {...field} label={label} hint={hint} error={error} className={fieldClassName}>
    <Control {...props} {...field} className={` ${error ? "ui-input-error exact:[border-color:var(--error)]!" : ""} ${className}`.trim()} />
  </Field>;
}
