"use client";

export default function Tabs({ items, value, onChange, idPrefix = "tabs", label }) {
  function handleKeyDown(event, index) {
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % items.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = items.length - 1;
    else return;
    event.preventDefault();
    onChange(items[nextIndex].id);
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[nextIndex]?.focus();
  }

  return (
    <div className="border-b border-line" role="tablist" aria-label={label}>
      <div className="flex gap-5">
        {items.map((item, index) => {
          const selected = value === item.id;
          return (
            <button
              key={item.id}
              type="button"
              id={`${idPrefix}-${item.id}-tab`}
              role="tab"
              aria-selected={selected}
              aria-controls={`${idPrefix}-${item.id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(item.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`-mb-px min-h-11 border-b-2 px-1 text-sm font-medium transition-colors ${selected ? "border-brand text-brand" : "border-transparent text-ink-muted hover:text-ink"}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
