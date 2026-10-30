"use client";

import { Search, X } from "lucide-react";
import Field, { useField } from "./field";
import Control from "./control.js";

// The parent owns the query and any existing debounce/fetch behavior.
export default function SearchBar({ id, label = "Search", hint, error, value, onChange, onClear, disabled, className = "", ...props }) {
  const field = useField({ ...props, id, hint, error });
  return <Field {...field} label={label} hint={hint} error={error} className={className}>
    <div className={"ui-search-control exact:relative"}>
      <Search size={18} className={"ui-search-icon exact:absolute exact:[top:50%] exact:[left:var(--space-3)] exact:[transform:translateY(-50%)] exact:[color:var(--ink-subtle)] exact:[pointer-events:none]"} aria-hidden="true" />
      <Control {...props} {...field} type="search" className={` ui-search-input exact:[&]:[padding-left:var(--space-10)] ${onClear && value ? " ui-search-clearable exact:[padding-right:var(--space-11)] exact:[&::-webkit-search-cancel-button]:[appearance:none]" : ""}`} value={value} onChange={onChange} disabled={disabled} />
      {onClear && value && <button type="button" className={"ui-search-clear exact:absolute exact:[right:var(--space-1)] exact:[top:50%] exact:[transform:translateY(-50%)] exact:grid exact:[place-items:center] exact:[width:var(--space-8)] exact:[height:var(--space-8)] exact:[border:0] exact:[border-radius:var(--radius-sm)] exact:[background:transparent] exact:[color:var(--ink-muted)] exact:[&:hover]:[background:var(--canvas)]"} onClick={onClear} disabled={disabled} aria-label="Clear search"><X size={16} aria-hidden="true" /></button>}
    </div>
  </Field>;
}
