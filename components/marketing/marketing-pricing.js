"use client";

import { useState } from "react";
import { ArrowRight, Building2, Check, ChevronDown, Dumbbell, Minus, ShieldCheck, Users } from "lucide-react";
import { FEATURE_LABELS, snapshotEntitlements } from "../../lib/saasPlanRules.js";
import Modal from "../ui/modal.js";
import { MarketingButton, MarketingPrimaryAction } from "./marketing-primitives.js";
import styles from "./marketing.module.css";

const money = (value) => Number(value).toLocaleString("en-PK", { maximumFractionDigits: 2 });
const resource = (value, noun) => value == null ? `Unlimited ${noun}` : `${money(value)} ${noun}`;
const descriptions = { basic: "A strong foundation for your everyday operations.", pro: "More insight and room for your growing gym.", professional: "One connected operation, across your locations." };

export default function MarketingPricing({ plans, pricingAvailable, trialAvailable, trialPlanName }) {
  const [selected, setSelected] = useState(null);
  if (!pricingAvailable || !plans.length) return <div className={styles.pricingUnavailable} role="status"><ShieldCheck size={28} /><h3>We couldn’t load current pricing.</h3><p>Please check again later, or log in to see your billing options.</p><MarketingButton href="/login" variant="outline">Log in <ArrowRight size={16} /></MarketingButton></div>;
  const catalog = plans.map((plan) => ({ ...plan, ...snapshotEntitlements(plan) }));

  return <>
    <div className={styles.pricingGrid}>{catalog.map((plan) => {
      const recommended = plan.key === "pro";
      return <article key={plan.id} className={`${styles.priceCard} ${recommended ? styles.recommended : ""}`}>
        {recommended && <div className={styles.recommendedLabel}>THE GROWING GYM’S SWEET SPOT <span>Recommended</span></div>}
        <div className={styles.planTitle}><h3>{plan.name}</h3>{plan.features.multiBranch && <Building2 size={22} aria-label="Multi-branch plan" />}</div>
        <p className={styles.planDescription}>{descriptions[plan.key] || plan.description}</p>
        <div className={styles.planPrice}><span>PKR</span><strong>{money(plan.interval === "yearly" ? plan.price / 12 : plan.price)}</strong><span>/mo</span></div>
        <p className={styles.planInterval}>{plan.interval === "yearly" ? `PKR ${money(plan.price)} billed yearly` : "Billed monthly in PKR"}</p>
        <MarketingButton variant={recommended ? "primary" : "outline"} className="w-full" onClick={() => setSelected(plan)} aria-haspopup="dialog">Choose {plan.name}<ArrowRight size={16} aria-hidden="true" /></MarketingButton>
        <ul className={styles.planLimits}><li><Users size={15} aria-hidden="true" />{resource(plan.limits.members, "active members")}</li><li><Users size={15} aria-hidden="true" />{resource(plan.limits.staff, "staff accounts")}</li><li><Building2 size={15} aria-hidden="true" />{resource(plan.limits.branches, plan.limits.branches === 1 ? "branch" : "branches")}</li><li><Dumbbell size={15} aria-hidden="true" />{resource(plan.limits.trainers, "trainers")}</li></ul>
        <p className={styles.includedLabel}>WHAT’S INCLUDED</p>
        <ul className={styles.planFeatures}>{Object.entries(FEATURE_LABELS).filter(([key]) => plan.features[key]).map(([key, label]) => <li key={key}><Check size={15} aria-hidden="true" />{label}</li>)}</ul>
      </article>;
    })}</div>
    <p className={styles.pricingNote}>No automatic renewals. Paid plans start after payment verification. {trialAvailable ? `New eligible gyms start with a 7-day ${trialPlanName} trial.` : "Public trial registration is currently closed."}</p>
    <details className={styles.comparison}><summary>Compare every feature <ChevronDown size={17} aria-hidden="true" /></summary><div className={styles.comparisonScroll} tabIndex={0} role="region" aria-label="Scrollable plan comparison"><table><caption className="sr-only">Current configured Fitivo plan features</caption><thead><tr><th scope="col">Find your fit</th>{catalog.map((plan) => <th scope="col" key={plan.id}>{plan.name}</th>)}</tr></thead><tbody>{Object.entries(FEATURE_LABELS).map(([key, label]) => <tr key={key}><th scope="row">{label}</th>{catalog.map((plan) => <td key={plan.id}>{plan.features[key] ? <><Check size={17} aria-hidden="true" /><span className="sr-only">Included</span></> : <><Minus size={15} aria-hidden="true" /><span className="sr-only">Not included</span></>}</td>)}</tr>)}</tbody></table></div></details>
    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? `${selected.name}, for your next step.` : "Choose your plan"} description="Choose a paid plan from your gym’s Plan & billing page.">
      {selected && <div className={styles.planDialog}>
        <div><strong>PKR {money(selected.price)}</strong><span> / {selected.interval === "yearly" ? "year" : "month"}</span></div>
        <p>Already have a gym account? Open <strong>Plan & billing</strong> and request <strong>{selected.name}</strong>. If you’re signed out, log in first, then open Billing from your workspace.</p>
        <MarketingButton href="/billing">Open plan & billing <ArrowRight size={16} /></MarketingButton>
        {trialAvailable && <div className={styles.planTrial}><h3>New to Fitivo?</h3><p>Start with the configured 7-day {trialPlanName} trial. You can request {selected.name} from Billing after registration.</p><MarketingPrimaryAction trialAvailable /></div>}
        {!trialAvailable && <p className={styles.dialogNote}>Public registration is currently closed. Existing gym owners can request this plan in their workspace.</p>}
        <p className={styles.dialogNote}><ShieldCheck size={15} />Selecting a plan here does not activate or change a subscription. Paid access begins after payment is verified.</p>
      </div>}
    </Modal>
  </>;
}

