"use client";

import { useRef } from "react";
import Modal from "./modal";
import Button from "./button";

export default function ConfirmDialog({ open, onClose, onConfirm, title, description, children, confirmLabel = "Confirm", cancelLabel = "Cancel", variant = "danger", loading = false, error }) {
  const cancelRef = useRef(null);
  return <Modal open={open} onClose={onClose} title={title} description={description} role="alertdialog" dismissible={!loading} initialFocusRef={cancelRef}
    footer={<><Button ref={cancelRef} type="button" variant="secondary" onClick={onClose} disabled={loading}>{cancelLabel}</Button><Button type="button" variant={variant} onClick={onConfirm} loading={loading} loadingLabel="Working…">{confirmLabel}</Button></>}>
    {children}
    {error && <p className="ui-field-error" role="alert">{error}</p>}
  </Modal>;
}
