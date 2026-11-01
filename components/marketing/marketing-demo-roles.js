"use client";

import { useId, useRef, useState } from "react";
import { DEMO_ROLES as roles } from "../../config/site.js";
import MarketingCapabilityPanel from "./marketing-capability-panel.js";
import { BulletList } from "./marketing-page-sections.js";
import styles from "./marketing-pages.module.css";



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
    {roles.map((role, index) => <div key={role.id} id={`${id}-panel-${role.id}`} role="tabpanel" aria-labelledby={`${id}-tab-${role.id}`} hidden={active !== index} tabIndex={0}><div className={styles.split}><div><h3 className={styles.spotTitle}>{role.title}</h3><p className={styles.bodyCopy}>{role.description}</p><BulletList items={role.items} /></div><MarketingCapabilityPanel title={`${role.label} workspace`} description={role.description} areas={role.items.slice(0,2)} /></div></div>)}
    <p className={styles.note}>These are workspace descriptions, not product captures. Members are supported through the gym team; there is no separate member login portal.</p>
  </div>;
}
