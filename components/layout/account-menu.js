"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LoaderCircle, LogOut } from "lucide-react";
import Avatar from "../ui/avatar.js";

export default function AccountMenu({ name = "", email = "", role, links = [], onLogout, loggingOut = false }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef(null);
  const trigger = useRef(null);
  const menu = useRef(null);

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector('[role="menuitem"]')?.focus();
    const dismiss = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("focusin", dismiss);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("focusin", dismiss);
    };
  }, [open]);

  function close(restoreFocus = true) {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  }

  function handleKeyDown(event) {
    const items = [...menu.current.querySelectorAll('[role="menuitem"]:not(:disabled)')];
    const current = items.indexOf(document.activeElement);
    let next;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key === "ArrowDown") next = (current + 1) % items.length;
    else if (event.key === "ArrowUp") next = (current - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else return;
    event.preventDefault();
    items[next]?.focus();
  }

  return <div ref={root} className="relative shrink-0">
    <button
      ref={trigger}
      type="button"
      aria-label="Open account menu"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? id : undefined}
      onClick={() => setOpen((value) => !value)}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          setOpen(true);
        }
      }}
      className="group relative flex size-11 items-center justify-center gap-1 rounded-full border border-line bg-surface p-0.5 text-ink-muted transition-colors hover:border-line-strong hover:bg-surface-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none"
    >
      <Avatar name={name || email} size="sm" className="border border-line" />
      <ChevronDown size={13} strokeWidth={1.8} aria-hidden="true" className="absolute right-0 bottom-0 rounded-full bg-surface text-ink-subtle" />
    </button>
    {open && <div
      id={id}
      ref={menu}
      role="menu"
      aria-label="Account"
      onKeyDown={handleKeyDown}
      className="absolute right-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(70vh,30rem)] w-[min(18rem,calc(100vw-1.5rem))] overflow-y-auto rounded-xl border border-line bg-surface p-1.5 text-ink shadow-lg shadow-slate-900/10"
    >
      <div className="border-b border-line px-3 py-3">
        <p className="truncate text-sm font-semibold text-ink">{name || "Your account"}</p>
        <p className="mt-0.5 truncate text-xs text-ink-muted">{email}</p>
        <span className="mt-2 inline-flex max-w-full items-center rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand-soft-text">{role}</span>
      </div>
      {links.length > 0 && <div className="py-1" role="group" aria-label="Account links">
        {links.map(({ href, label }) => <Link
          key={href}
          href={href}
          role="menuitem"
          tabIndex={-1}
          onClick={() => close(false)}
          className="flex min-h-11 items-center rounded-lg px-3 text-sm text-ink-muted outline-none transition-colors hover:bg-surface-raised hover:text-ink focus-visible:bg-surface-raised focus-visible:text-ink motion-reduce:transition-none"
        >{label}</Link>)}
      </div>}
      <div className="border-t border-line pt-1">
        <button
          type="button"
          role="menuitem"
          tabIndex={-1}
          disabled={loggingOut}
          onClick={() => { close(false); onLogout(); }}
          className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-danger outline-none transition-colors hover:bg-danger-soft focus-visible:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
        >
          {loggingOut ? <LoaderCircle size={16} aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : <LogOut size={16} aria-hidden="true" />}
          {loggingOut ? "Signing out…" : "Log out"}
        </button>
      </div>
    </div>}
  </div>;
}
