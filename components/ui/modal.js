"use client";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

const openDialogs = new Set();
let previousOverflow;

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
    <dialog ref={dialogRef} className={`ui-modal-backdrop${["left", "right"].includes(placement) ? ` ui-drawer-backdrop ui-drawer-${placement}` : ""}`} role={role} aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined}
      onCancel={(event) => { event.preventDefault(); if (dismissible) onClose?.(); }}
      onPointerDown={(event) => { pointerStartedOnBackdrop.current = event.target === event.currentTarget; }}
      onClick={(event) => { if (dismissible && pointerStartedOnBackdrop.current && event.target === event.currentTarget) onClose?.(); }}>
      <section className={`ui-modal ${className}`.trim()}>
        <header className="ui-modal-header"><div><h2 id={`${id}-title`}>{title}</h2>{description && <p id={`${id}-description`}>{description}</p>}</div><button type="button" className="ui-icon-button" aria-label="Close dialog" onClick={onClose} disabled={!dismissible}><X size={18} aria-hidden="true" /></button></header>
        <div className="ui-modal-content">{children}</div>
        {footer && <footer className="ui-modal-footer">{footer}</footer>}
      </section>
    </dialog>
  );
}
