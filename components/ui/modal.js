"use client";
import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, description, children, className = "" }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => { if (event.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="ui-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <section className={`ui-modal ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby="ui-modal-title">
        <header className="ui-modal-header"><div><h2 id="ui-modal-title">{title}</h2>{description && <p>{description}</p>}</div><button type="button" className="ui-icon-button" aria-label="Close dialog" onClick={onClose}><X size={18} /></button></header>
        <div className="ui-modal-content">{children}</div>
      </section>
    </div>
  );
}
