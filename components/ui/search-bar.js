"use client";

import { Search, X } from "lucide-react";
import Field, { useField } from "./field";

// The parent owns the query and any existing debounce/fetch behavior.
export default function SearchBar({ id, label = "Search", hint, error, value, onChange, onClear, disabled, className = "", ...props }) {
  const field = useField({ ...props, id, hint, error });
  return <Field {...field} label={label} hint={hint} error={error} className={className}>
    <div className="ui-search-control">
      <Search size={18} className="ui-search-icon" aria-hidden="true" />
      <input {...props} {...field} type="search" className={`ui-input ui-search-input${onClear && value ? " ui-search-clearable" : ""}`} value={value} onChange={onChange} disabled={disabled} />
      {onClear && value && <button type="button" className="ui-search-clear" onClick={onClear} disabled={disabled} aria-label="Clear search"><X size={16} aria-hidden="true" /></button>}
    </div>
  </Field>;
}
