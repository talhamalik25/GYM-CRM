"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Building2, Check, ChevronDown, LoaderCircle } from "lucide-react";

export default function BranchSwitcher() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  const menu = useRef(null);

  useEffect(() => {
    let active = true;
    fetch("/api/branches", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error?.message || "Could not load branches.");
        if (active) setData(result.data);
      })
      .catch((requestError) => { if (active) setLoadError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    const options = [...menu.current.querySelectorAll('[role="menuitemradio"]')];
    const selected = options.find((option) => option.getAttribute("aria-checked") === "true");
    (selected || options[0])?.focus();
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

  async function select(branchId) {
    if (!branchId || branchId === data.selectedBranchId || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "select", branchId }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Could not switch branches.");
      // Reload clears all client caches and forms from the previous branch.
      window.location.assign(branchId === "all" ? "/reports" : "/dashboard");
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
      setOpen(false);
      trigger.current?.focus();
    }
  }

  function close(restoreFocus = true) {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  }

  function handleKeyDown(event) {
    const options = [...menu.current.querySelectorAll('[role="menuitemradio"], [role="menuitem"]')];
    const current = options.indexOf(document.activeElement);
    let next;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key === "ArrowDown") next = (current + 1) % options.length;
    else if (event.key === "ArrowUp") next = (current - 1 + options.length) % options.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    else return;
    event.preventDefault();
    options[next]?.focus();
  }

  if (loading) return <span role="status" aria-label="Loading branches" className="grid size-11 shrink-0 place-items-center rounded-lg border border-line bg-surface text-ink-subtle"><LoaderCircle size={16} aria-hidden="true" className="animate-spin motion-reduce:animate-none" /><span className="sr-only">Loading branches…</span></span>;
  if (loadError) return <span role="status" title={loadError} className="max-w-24 truncate text-xs text-ink-subtle">Branches unavailable</span>;
  if (!data?.enabled) return null;

  const selectedBranch = data.selectedBranchId === "all"
    ? "All branches"
    : data.branches.find((branch) => String(branch._id) === data.selectedBranchId)?.name
      || data.branches.find((branch) => String(branch._id) === data.defaultBranchId)?.name
      || "Select branch";
  const options = [
    ...data.branches.map((branch) => ({
      id: String(branch._id),
      label: `${branch.name}${branch.status === "inactive" ? " · history only" : ""}`,
    })),
    ...(data.role === "gym_owner" && data.consolidated ? [{ id: "all", label: "All branches · Reports" }] : []),
  ];

  return <div ref={root} className="relative min-w-0">
    <button
      ref={trigger}
      type="button"
      aria-label={`Current branch: ${selectedBranch}. Change branch`}
      aria-haspopup="menu"
      aria-expanded={open}
      disabled={busy}
      onClick={() => { setError(""); setOpen((value) => !value); }}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          setOpen(true);
        }
      }}
      className="flex min-h-11 min-w-0 max-w-[10rem] items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-left text-sm text-ink-muted transition-colors hover:border-line-strong hover:bg-surface-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-70 sm:max-w-[13rem] max-[359px]:max-w-[8rem] motion-reduce:transition-none"
    >
      {busy ? <LoaderCircle size={17} aria-hidden="true" className="shrink-0 animate-spin motion-reduce:animate-none" /> : <Building2 size={17} aria-hidden="true" className="shrink-0 text-brand" />}
      <span className="min-w-0 flex-1 truncate font-medium">{busy ? "Switching…" : selectedBranch}</span>
      {!busy && <ChevronDown size={15} aria-hidden="true" className={`shrink-0 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />}
    </button>
    {open && <div
      ref={menu}
      role="menu"
      aria-label="Choose a branch"
      onKeyDown={handleKeyDown}
      className="absolute right-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(70vh,24rem)] w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto rounded-xl border border-line bg-surface p-1.5 text-ink shadow-lg shadow-slate-900/10"
    >
      <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">Switch branch</p>
      {options.map(({ id, label }) => {
        const selected = id === data.selectedBranchId;
        return <button
          key={id}
          type="button"
          role="menuitemradio"
          aria-checked={selected}
          tabIndex={-1}
          disabled={busy}
          onClick={() => select(id)}
          className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm outline-none transition-colors hover:bg-surface-raised focus-visible:bg-surface-raised disabled:opacity-60 motion-reduce:transition-none ${selected ? "bg-brand-soft font-medium text-brand-soft-text" : "text-ink-muted"}`}
        >
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {selected && <Check size={16} aria-hidden="true" className="shrink-0" />}
        </button>;
      })}
      {data.role === "gym_owner" && <div className="mt-1 border-t border-line pt-1">
        <Link
          href="/branches"
          role="menuitem"
          tabIndex={-1}
          onClick={() => close(false)}
          className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-ink-muted outline-none transition-colors hover:bg-surface-raised hover:text-ink focus-visible:bg-surface-raised motion-reduce:transition-none"
        ><Building2 size={16} aria-hidden="true" />Manage branches</Link>
      </div>}
    </div>}
    {error && <p role="alert" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(20rem,calc(100vw-1.5rem))] rounded-lg border border-danger/20 bg-surface px-3 py-2 text-xs text-danger shadow-md">{error}</p>}
  </div>;
}
