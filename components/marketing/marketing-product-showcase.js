"use client";

import { useId, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { PRODUCT_VIEWS } from "../../lib/marketing/home.js";
import MarketingPreviewPlaceholder from "./marketing-preview-placeholder.js";
import styles from "./marketing-home.module.css";

export default function MarketingProductShowcase({ showDetailsLink = true }) {
  const [selected, setSelected] = useState(0);
  const refs = useRef([]);
  const id = useId();
  function selectWithKeyboard(event, index) {
    const next = event.key === "ArrowRight" ? (index + 1) % PRODUCT_VIEWS.length : event.key === "ArrowLeft" ? (index - 1 + PRODUCT_VIEWS.length) % PRODUCT_VIEWS.length : event.key === "Home" ? 0 : event.key === "End" ? PRODUCT_VIEWS.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    setSelected(next);
    refs.current[next]?.focus();
  }
  return <div className={styles.showcase}>
    <div className={styles.showcaseLabel}><span>Inside Fitivo</span><span>Four connected parts of your day</span></div>
    <div className={styles.productTabs} role="tablist" aria-label="Explore Fitivo workspaces">{PRODUCT_VIEWS.map((view, index) => <button key={view.id} ref={el => { refs.current[index] = el; }} type="button" role="tab" id={`${id}-tab-${view.id}`} aria-controls={`${id}-panel-${view.id}`} aria-selected={selected === index} tabIndex={selected === index ? 0 : -1} onClick={() => setSelected(index)} onKeyDown={event => selectWithKeyboard(event, index)}>{view.label}</button>)}</div>
    {PRODUCT_VIEWS.map((view, index) => <div key={view.id} role="tabpanel" id={`${id}-panel-${view.id}`} aria-labelledby={`${id}-tab-${view.id}`} hidden={selected !== index} tabIndex={0}><MarketingPreviewPlaceholder title={view.label} description={view.description} areas={view.areas} /></div>)}
    <div className={styles.showcaseBottom}><p>One gym. Connected records. A clearer day.</p>{showDetailsLink && <Link href="/demo">Explore the workspaces <ArrowUpRight size={15} aria-hidden="true" /></Link>}</div>
  </div>;
}
