"use client";

import { useId, useRef, useState } from "react";
import { Activity, Building2, CalendarCheck2, ChartNoAxesCombined, CreditCard, LayoutDashboard, Users } from "lucide-react";
import MarketingProductPreview from "./marketing-product-preview.js";
import styles from "./marketing.module.css";

const tabs = [["overview", "Dashboard", LayoutDashboard], ["members", "Members", Users], ["attendance", "Attendance", Activity], ["renewals", "Renewals", CalendarCheck2], ["payments", "Payments", CreditCard], ["reports", "Reports", ChartNoAxesCombined], ["branches", "Branches", Building2]];
const descriptions = {
  overview: "Start with a clear overview of members, collections, and the day ahead.",
  members: "Give every member an organized record, from first visit to latest renewal.",
  attendance: "Keep track of visits and understand your gym’s daily rhythm.",
  renewals: "See expiring memberships and keep renewal history close at hand.",
  payments: "Bring payment records, outstanding dues, and receipts into one view.",
  reports: "Review performance with analytics and reports on eligible plans.",
  branches: "Bring your locations together with Professional multi-branch management.",
};

export default function MarketingProductShowcase() {
  const [active, setActive] = useState("overview");
  const tabRefs = useRef([]);
  const id = useId();
  function handleKeyDown(event, index) {
    const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index - 1 + tabs.length) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); setActive(tabs[next][0]); tabRefs.current[next]?.focus();
  }
  return <div className={styles.showcase}>
    <div className={styles.productTabs} role="tablist" aria-label="Explore Fitivo product areas">{tabs.map(([key, label, Icon], index) => <button key={key} ref={(el) => { tabRefs.current[index] = el; }} type="button" role="tab" id={`${id}-tab-${key}`} aria-selected={active === key} aria-controls={`${id}-panel`} tabIndex={active === key ? 0 : -1} onClick={() => setActive(key)} onKeyDown={(event) => handleKeyDown(event, index)}><Icon size={16} aria-hidden="true" />{label}</button>)}</div>
    <div id={`${id}-panel`} role="tabpanel" tabIndex={0} aria-labelledby={`${id}-tab-${active}`} className={styles.productPanel}><p className={styles.productDescription}>{descriptions[active]}</p><MarketingProductPreview kind={active} /></div>
  </div>;
}
