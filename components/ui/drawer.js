"use client";

import Modal from "./modal";

export default function Drawer({ side = "right", ...props }) {
  return <Modal {...props} placement={side === "left" ? "left" : "right"} />;
}
