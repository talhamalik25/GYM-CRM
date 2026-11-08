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
    const items = [...(menu.current?.querySelectorAll('[role="menuitem"]:not(:disabled)') || [])];
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

  return (
    <div ref={root} className="relative shrink-0">
      <button
        ref={trigger}
        type="button"
        aria-label={open ? "Close account menu" : "Open account menu"}
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
        className="group relative flex size-11 items-center justify-center rounded-xl border border-line bg-surface p-0.5 text-ink-muted shadow-xs transition-colors hover:border-line-strong hover:bg-surface-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none"
      >
        <Avatar name={name || email} size="sm" className="ring-1 ring-line" />
        <span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full border border-line bg-surface text-ink-subtle rtl:-right-auto rtl:-left-0.5">
          <ChevronDown
            size={10}
            strokeWidth={2.5}
            aria-hidden="true"
            className={`transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && (
        <div
          id={id}
          ref={menu}
          role="menu"
          aria-label="Account"
          onKeyDown={handleKeyDown}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(70vh,30rem)] w-[min(18rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-line bg-surface p-2 text-ink shadow-xl shadow-slate-900/10 rtl:right-auto rtl:left-0"
        >
          {/* User info banner */}
          <div role="group" aria-label="Signed-in account" className="rounded-xl bg-surface-raised/60 p-3">
            <div className="flex items-center gap-3">
              <Avatar name={name || email} size="sm" className="ring-1 ring-line shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink leading-tight">{name || "Your account"}</p>
                <p className="truncate text-xs text-ink-muted mt-0.5" title={email}>{email}</p>
              </div>
            </div>
            {role && (
              <div className="mt-2.5">
                <span className="inline-flex items-center rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand-soft-text">
                  {role}
                </span>
              </div>
            )}
          </div>

          {/* Account links */}
          {links.length > 0 && (
            <div className="py-1.5 space-y-0.5" role="group" aria-label="Account links">
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => close(false)}
                  className="flex min-h-10 items-center rounded-xl px-3 text-sm font-medium text-ink-muted outline-none transition-colors hover:bg-surface-raised hover:text-ink focus-visible:bg-surface-raised focus-visible:text-ink motion-reduce:transition-none rtl:text-right"
                >
                  {label}
                </Link>
              ))}
            </div>
          )}

          {/* Sign out item */}
          <div role="group" aria-label="Session actions" className="border-t border-line/60 pt-1.5">
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              disabled={loggingOut}
              onClick={() => { close(false); onLogout(); }}
              className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-medium text-danger outline-none transition-colors hover:bg-danger-soft focus-visible:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none rtl:text-right"
            >
              {loggingOut ? (
                <LoaderCircle size={15} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
              ) : (
                <LogOut size={15} strokeWidth={1.8} aria-hidden="true" />
              )}
              <span>{loggingOut ? "Signing out…" : "Log out"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
