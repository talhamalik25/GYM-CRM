"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import Button from "./button.js";

// Items describe existing links/actions; this component only manages presentation.
export default function Dropdown({ label = "Actions", items = [], align = "right", disabled = false }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  const menu = useRef(null);
  const initialPosition = useRef(0);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const entries = menu.current.querySelectorAll('[role="menuitem"]:not(:disabled)');
    entries[initialPosition.current === -1 ? entries.length - 1 : 0]?.focus();
    const dismiss = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("focusin", dismiss);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("focusin", dismiss);
    };
  }, [open]);
  function close() { setOpen(false); trigger.current?.focus(); }
  function handleKey(event) {
    const entries = [...menu.current.querySelectorAll('[role="menuitem"]:not(:disabled)')];
    const current = entries.indexOf(document.activeElement);
    let next;
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (event.key === "ArrowDown") next = (current + 1) % entries.length;
    else if (event.key === "ArrowUp") next = (current - 1 + entries.length) % entries.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = entries.length - 1;
    else return;
    event.preventDefault(); entries[next]?.focus();
  }
  return <div className={"ui-dropdown exact:relative exact:[display:inline-block]"} ref={root}>
    <Button variant="secondary" type="button" ref={trigger} className={""} disabled={disabled} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined}
      onClick={() => { initialPosition.current = 0; setOpen(!open); }}
      onKeyDown={(event) => { if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); initialPosition.current = event.key === "ArrowUp" ? -1 : 0; setOpen(true); } }}>
      {label}<ChevronDown size={16} aria-hidden="true" />
    </Button>
    {open && <div id={id} ref={menu} role="menu" aria-label={typeof label === "string" ? label : "Actions"} className={`ui-dropdown-menu exact:absolute exact:[top:calc(100%_+_var(--space-2))] exact:[z-index:30] exact:[width:max-content] exact:[min-width:12rem] exact:[max-width:min(20rem,_calc(100vw_-_var(--space-8)))] exact:[padding:var(--space-1)] exact:[border:1px_solid_var(--line)] exact:[border-radius:var(--radius-md)] exact:[background:var(--surface)] exact:[box-shadow:var(--shadow-md)] ${align === "left" ? "ui-dropdown-left exact:[left:0]" : "ui-dropdown-right exact:[right:0]"}`} onKeyDown={handleKey}>
      {items.map((item) => {
        const props = { role: "menuitem", tabIndex: -1, className: `ui-dropdown-item exact:block exact:[width:100%] exact:[padding:var(--space-3)] exact:[border:0] exact:[border-radius:var(--radius-sm)] exact:[background:transparent] exact:[color:var(--ink)] exact:[font-size:var(--text-sm)] exact:[text-align:left] exact:[overflow-wrap:anywhere] exact:[&:hover]:[background:var(--canvas)] exact:[&:focus-visible]:[background:var(--canvas)] exact:[&:disabled]:[opacity:.5] exact:[&:disabled]:[cursor:not-allowed]${item.danger ? " ui-dropdown-danger exact:[color:var(--danger)]" : ""}`, onClick: () => { close(); item.onSelect?.(); } };
        return item.href && !item.disabled ? <Link key={item.id} {...props} href={item.href}>{item.label}</Link> : <button key={item.id} {...props} type="button" disabled={item.disabled}>{item.label}</button>;
      })}
    </div>}
  </div>;
}
