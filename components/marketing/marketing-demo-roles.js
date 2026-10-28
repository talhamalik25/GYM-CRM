"use client";

import { useId, useRef, useState } from "react";
import MarketingPreviewPlaceholder from "./marketing-preview-placeholder.js";
import { BulletList } from "./marketing-page-sections.js";
import styles from "./marketing-pages.module.css";

const roles = [
  { id: "owner", label: "Gym owner", title: "The wider view of your gym.", description: "Bring your people, memberships and daily records together.", items: ["Gym setup and membership plans", "Members, trainers and staff", "Payments and reports within your plan"] },
  { id: "trainer", label: "Trainer", title: "A workspace for your assigned members.", description: "See the member details and recent attendance relevant to your work.", items: ["Assigned member roster", "Membership status and expiry dates", "Recent attendance"] },
  { id: "staff", label: "Front desk & finance", title: "Keep the everyday records moving.", description: "Use authorized staff access for front-desk and payment responsibilities.", items: ["Member records and check-ins", "Recorded payments and receipts", "Outstanding dues and manual follow-ups"] },
];

export default function MarketingDemoRoles() {
  const [active, setActive] = useState(0);
  const refs = useRef([]);
  const id = useId();
  function handleKey(event, index) {
    const next = event.key === "ArrowRight" ? (index + 1) % roles.length : event.key === "ArrowLeft" ? (index + roles.length - 1) % roles.length : event.key === "Home" ? 0 : event.key === "End" ? roles.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); setActive(next); refs.current[next]?.focus();
  }
  return <div>
    <div className={styles.roleTabs} role="tablist" aria-label="Choose a team workspace">{roles.map((role, index) => <button key={role.id} ref={el => { refs.current[index] = el; }} type="button" role="tab" id={`${id}-tab-${role.id}`} aria-controls={`${id}-panel-${role.id}`} aria-selected={active === index} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={event => handleKey(event, index)}>{role.label}</button>)}</div>
    {roles.map((role, index) => <div key={role.id} id={`${id}-panel-${role.id}`} role="tabpanel" aria-labelledby={`${id}-tab-${role.id}`} hidden={active !== index} tabIndex={0}><div className={styles.split}><div><h3 className={styles.spotTitle}>{role.title}</h3><p className={styles.bodyCopy}>{role.description}</p><BulletList items={role.items} /></div><MarketingPreviewPlaceholder compact title={role.label + " workspace"} description={role.description} areas={role.items.slice(0,2)} /></div></div>)}
    <p className={styles.note}>These are workspace descriptions, not product captures. Members are supported through the gym team; there is no separate member login portal.</p>
  </div>;
}
