"use client";

import { useId } from "react";

export default function Tabs({ items, value, onChange, idPrefix, label = "Sections", className = "" }) {
  const generatedId = useId();
  const prefix = idPrefix || `tabs-${generatedId}`;
  function handleKeyDown(event, index) {
    const enabled = items.map((item, position) => !item.disabled ? position : -1).filter(position => position >= 0);
    if (!enabled.length) return;
    const position = enabled.indexOf(index);
    let nextIndex;
    if (event.key === "ArrowRight") nextIndex = enabled[(position + 1) % enabled.length];
    else if (event.key === "ArrowLeft") nextIndex = enabled[(position - 1 + enabled.length) % enabled.length];
    else if (event.key === "Home") nextIndex = enabled[0];
    else if (event.key === "End") nextIndex = enabled.at(-1);
    else return;
    event.preventDefault();
    onChange(items[nextIndex].id);
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[nextIndex]?.focus();
  }

  return (
    <div className={`ui-tabs ${className}`.trim()} role="tablist" aria-label={label}>
        {items.map((item, index) => {
          const selected = value === item.id;
          return (
            <button
              key={item.id}
              type="button"
              id={`${prefix}-${item.id}-tab`}
              role="tab"
              aria-selected={selected}
              aria-controls={`${prefix}-${item.id}-panel`}
              disabled={item.disabled}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(item.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className="ui-tab"
            >
              {item.label}
            </button>
          );
        })}
    </div>
  );
}
