"use client";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

const openDialogs = new Set();
let previousOverflow;
const placements = { left: "ui-drawer-backdrop exact:[&>.ui-modal]:flex exact:[&>.ui-modal]:flex-col exact:[&>.ui-modal]:[width:min(100%,_480px)] exact:[&>.ui-modal]:[height:100%] exact:[&>.ui-modal]:[max-height:none] exact:[&>.ui-modal]:[border-radius:0] exact:[&_.ui-modal-header]:[flex-shrink:0] exact:[&_.ui-modal-content]:[flex:1] exact:[&_.ui-modal-content]:[min-height:0] exact:[&_.ui-modal-content]:[overflow-y:auto] exact:[&_.ui-modal-content]:[overscroll-behavior:contain] exact:[&>.shell-navigation-drawer]:[width:min(320px,_calc(100vw_-_40px))] exact:[&>.shell-navigation-drawer]:[background:var(--surface)] exact:[&>.shell-navigation-drawer]:[color:var(--ink)] exact:[&>.shell-navigation-drawer]:[border-color:var(--line)] ui-drawer-left", right: "ui-drawer-backdrop exact:[&>.ui-modal]:flex exact:[&>.ui-modal]:flex-col exact:[&>.ui-modal]:[width:min(100%,_480px)] exact:[&>.ui-modal]:[height:100%] exact:[&>.ui-modal]:[max-height:none] exact:[&>.ui-modal]:[border-radius:0] exact:[&_.ui-modal-header]:[flex-shrink:0] exact:[&_.ui-modal-content]:[flex:1] exact:[&_.ui-modal-content]:[min-height:0] exact:[&_.ui-modal-content]:[overflow-y:auto] exact:[&_.ui-modal-content]:[overscroll-behavior:contain] exact:[&>.shell-navigation-drawer]:[width:min(320px,_calc(100vw_-_40px))] exact:[&>.shell-navigation-drawer]:[background:var(--surface)] exact:[&>.shell-navigation-drawer]:[color:var(--ink)] exact:[&>.shell-navigation-drawer]:[border-color:var(--line)] ui-drawer-right" };

export default function Modal({ open, onClose, title, description, children, footer, className = "", placement = "center", dismissible = true, initialFocusRef, role = "dialog" }) {
  const dialogRef = useRef(null);
  const pointerStartedOnBackdrop = useRef(false);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    dialog.showModal();
    if (!openDialogs.size) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    openDialogs.add(dialog);
    if (initialFocusRef?.current && dialog.contains(initialFocusRef.current)) initialFocusRef.current.focus();
    return () => {
      const wasTopDialog = [...openDialogs].at(-1) === dialog;
      if (dialog.open) dialog.close();
      openDialogs.delete(dialog);
      if (!openDialogs.size) document.body.style.overflow = previousOverflow;
      if (wasTopDialog && previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [open, initialFocusRef]);

  if (!open) return null;
  return (
    <dialog ref={dialogRef} className={`ui-modal-backdrop exact:fixed exact:[inset:0] exact:[z-index:80] exact:grid exact:[place-items:center] exact:[overflow-y:auto] exact:[padding:20px] exact:[background:var(--overlay)] ${["left", "right"].includes(placement) ? placements[placement] : ""}`} role={role} aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined}
      onCancel={(event) => { event.preventDefault(); if (dismissible) onClose?.(); }}
      onPointerDown={(event) => { pointerStartedOnBackdrop.current = event.target === event.currentTarget; }}
      onClick={(event) => { if (dismissible && pointerStartedOnBackdrop.current && event.target === event.currentTarget) onClose?.(); }}>
      <section className={`ui-modal exact:[width:min(100%,_540px)] exact:[max-height:min(88vh,_780px)] exact:[overflow:auto] exact:[border:1px_solid_var(--line)] exact:[border-radius:var(--radius-xl)] exact:[background:var(--surface)] exact:[box-shadow:var(--shadow-lg)] ${className}`.trim()}>
        <header className={"ui-modal-header exact:flex exact:[align-items:flex-start] exact:[justify-content:space-between] exact:[gap:20px] exact:[padding:20px_24px_16px] exact:[border-bottom:1px_solid_var(--line)] exact:[&_h2]:[margin:0] exact:[&_h2]:[font-size:17px] exact:[&_h2]:[font-weight:700] exact:[&_h2]:[letter-spacing:-0.01em] exact:[&_p]:[margin:5px_0_0] exact:[&_p]:[color:var(--ink-muted)] exact:[&_p]:[font-size:13px]"}><div><h2 id={`${id}-title`}>{title}</h2>{description && <p id={`${id}-description`}>{description}</p>}</div><button type="button" className={"ui-icon-button exact:[&:focus-visible]:[outline:var(--focus-width)_solid_var(--focus-color)] exact:[&:focus-visible]:[outline-offset:var(--focus-offset)] exact:grid exact:[place-items:center] exact:[width:32px] exact:[height:32px] exact:[padding:0] exact:[border:1px_solid_var(--line)] exact:[border-radius:var(--radius-md)] exact:[background:var(--surface)] exact:[color:var(--ink-muted)] exact:[transition:background_0.15s,_color_0.15s] exact:[&:hover]:[background:var(--canvas)] exact:[&:hover]:[color:var(--ink)]"} aria-label="Close dialog" onClick={onClose} disabled={!dismissible}><X size={18} aria-hidden="true" /></button></header>
        <div className={"ui-modal-content exact:[padding:20px_24px]"}>{children}</div>
        {footer && <footer className={"ui-modal-footer exact:flex exact:[justify-content:flex-end] exact:flex-wrap exact:[gap:var(--space-3)] exact:[padding:var(--space-4)_var(--space-6)] exact:[border-top:1px_solid_var(--line)] exact:at-most-768:[padding:var(--space-4)]"}>{footer}</footer>}
      </section>
    </dialog>
  );
}
