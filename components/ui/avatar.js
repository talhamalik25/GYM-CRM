"use client";

import { useState } from "react";
import Image from "next/image";
import { UserRound } from "lucide-react";

export default function Avatar({ name = "", src, size = "md", className = "" }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = [words[0]?.[0], words.length > 1 ? words.at(-1)[0] : ""].filter(Boolean).join("").toUpperCase();
  return <span className={`ui-avatar ui-avatar-${["sm", "md", "lg"].includes(size) ? size : "md"} ${className}`.trim()} role="img" aria-label={name || "Account"}>
    {src && src !== failedSrc ? <Image src={src} alt="" width={64} height={64} unoptimized onError={() => setFailedSrc(src)} /> : initials || <UserRound size={18} aria-hidden="true" />}
  </span>;
}
