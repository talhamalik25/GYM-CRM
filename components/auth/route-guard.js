"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authStorageKey } from "../../lib/authService";

export default function RouteGuard({ children }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let isAuthenticated = false;
    try {
      isAuthenticated = window.localStorage.getItem(authStorageKey) === "true";
    } catch {
      isAuthenticated = false;
    }

    if (isAuthenticated) setAllowed(true);
    else router.replace("/login");
  }, [router]);

  if (!allowed) {
    return (
      <main className="grid min-h-screen place-items-center bg-canvas px-6" aria-live="polite" aria-busy="true">
        <p className="text-sm text-ink-muted">Checking sign-in…</p>
      </main>
    );
  }

  return children;
}
