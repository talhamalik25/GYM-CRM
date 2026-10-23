"use client";

import { useEffect, useState } from "react";

// Presentation-only reads of existing APIs. Each panel can fail and retry independently.
export default function useDashboardResource(url) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { cache: "no-store", signal: controller.signal }).then(async (response) => {
      let body;
      try { body = await response.json(); } catch { throw new Error("The server returned an unreadable response. Please try again."); }
      if (!response.ok || !body.success) throw new Error(body.error?.message || "Could not load this information. Please try again.");
      if (body.data == null) throw new Error("This information is unavailable. Please try again.");
      if (!controller.signal.aborted) setResult({ url, attempt, data: body.data, error: "" });
    }).catch((error) => {
      if (!controller.signal.aborted) setResult({ url, attempt, data: null, error: error.message });
    });
    return () => controller.abort();
  }, [url, attempt]);

  const ready = result?.url === url && result.attempt === attempt;
  return {
    data: ready ? result.data : null,
    error: ready ? result.error : "",
    loading: !ready,
    retry: () => setAttempt((value) => value + 1),
  };
}
