"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TrialCountdown({ endsAt, serverNow }) {
  const router = useRouter();
  const initialRemaining = Math.max(0, new Date(endsAt).getTime() - new Date(serverNow).getTime());
  const [remaining, setRemaining] = useState(initialRemaining);
  useEffect(() => {
    const mountedAt = performance.now();
    function tick() {
      const milliseconds = Math.max(0, initialRemaining - (performance.now() - mountedAt));
      setRemaining(milliseconds);
      if (milliseconds === 0) {
        router.replace("/billing");
        router.refresh();
      }
    }
    const timer = window.setInterval(tick, 1000);
    tick();
    return () => window.clearInterval(timer);
  }, [initialRemaining, router]);
  const seconds = Math.ceil(remaining / 1000);
  return <aside className="mb-5 rounded-lg border border-brand/30 bg-brand/5 p-4">
    <p className="font-semibold text-ink">Free trial: {Math.floor(seconds / 86400)}d {Math.floor(seconds / 3600) % 24}h {Math.floor(seconds / 60) % 60}m {seconds % 60}s remaining</p>
    <p className="mt-1 text-sm text-ink-muted">Expires <time dateTime={endsAt}>{new Date(endsAt).toISOString().replace("T", " ").replace("Z", " UTC")}</time>. <Link href="/billing" className="font-medium text-brand">View plans &amp; billing</Link></p>
  </aside>;
}
