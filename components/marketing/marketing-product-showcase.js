"use client";

import { useRef, useState } from "react";
import MarketingProductPreview from "./marketing-product-preview.js";

const tabs = [
  ["overview", "Overview"],
  ["members", "Members"],
  ["attendance", "Attendance"],
  ["payments", "Payments"],
  ["reports", "Reports"],
];

export default function MarketingProductShowcase() {
  const [active, setActive] = useState("overview");
  const tabRefs = useRef([]);

  function handleKeyDown(event, index) {
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;
    event.preventDefault();
    setActive(tabs[nextIndex][0]);
    tabRefs.current[nextIndex]?.focus();
  }

  return <div className="grid items-center gap-9 lg:grid-cols-[.7fr_1.3fr]">
    <div>
      <div role="tablist" aria-label="Product areas" className="grid gap-2">
        {tabs.map(([id, label], index) => <button key={id} ref={(element) => { tabRefs.current[index] = element; }} id={`showcase-tab-${id}`} type="button" role="tab" aria-selected={active === id} aria-controls="showcase-panel" tabIndex={active === id ? 0 : -1} onClick={() => setActive(id)} onKeyDown={(event) => handleKeyDown(event, index)} className={`rounded-xl border p-4 text-left transition ${active === id ? "border-brand bg-surface shadow-sm" : "border-transparent hover:border-line hover:bg-surface"}`}><span className="block text-sm font-semibold text-ink">{label}</span><span className="mt-1 block text-xs leading-5 text-ink-muted">{id === "overview" ? "A useful snapshot of the day." : id === "members" ? "Profiles, memberships, and renewals." : id === "attendance" ? "See gym check-ins over time." : id === "payments" ? "Keep payment records together." : "Review activity and performance."}</span></button>)}
      </div>
    </div>
    <div id="showcase-panel" role="tabpanel" aria-labelledby={`showcase-tab-${active}`}><MarketingProductPreview kind={active} /></div>
  </div>;
}
