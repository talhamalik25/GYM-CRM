"use client";

import { useState } from "react";
import Image from "next/image";
import { UserRound } from "lucide-react";
const sizes = { sm: "ui-avatar-sm exact:[width:var(--space-8)] exact:[height:var(--space-8)] exact:[font-size:var(--text-xs)]", md: "ui-avatar-md exact:[width:var(--space-10)] exact:[height:var(--space-10)] exact:[font-size:var(--text-sm)]", lg: "ui-avatar-lg exact:[width:var(--space-16)] exact:[height:var(--space-16)] exact:[font-size:var(--text-xl)]" };

export default function Avatar({ name = "", src, size = "md", className = "" }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = [words[0]?.[0], words.length > 1 ? words.at(-1)[0] : ""].filter(Boolean).join("").toUpperCase();
  return <span className={`ui-avatar exact:inline-grid exact:[place-items:center] exact:[flex-shrink:0] exact:overflow-hidden exact:[border-radius:var(--radius-pill)] exact:[background:var(--brand-soft)] exact:[color:var(--brand)] exact:[font-weight:var(--weight-semibold)] exact:[&_img]:[width:100%] exact:[&_img]:[height:100%] exact:[&_img]:[object-fit:cover] ${sizes[["sm", "md", "lg"].includes(size) ? size : "md"]} ${className}`.trim()} role="img" aria-label={name || "Account"}>
    {src && src !== failedSrc ? <Image src={src} alt="" width={64} height={64} unoptimized onError={() => setFailedSrc(src)} /> : initials || <UserRound size={18} aria-hidden="true" />}
  </span>;
}
