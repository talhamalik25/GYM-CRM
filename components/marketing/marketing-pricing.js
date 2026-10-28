"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PLANS, PRICING, marketingPlanAmount } from "../../lib/marketing/plans.js";
import { SITE } from "../../lib/marketing/site.js";
import styles from "./marketing-home.module.css";

const money = amount => new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(amount);

export default function MarketingPricing({ showDetailsLink = true }) {
  const [cycle, setCycle] = useState("monthly");
  const id = useId();
  return <div>
    <fieldset className={styles.billingToggle}><legend className={styles.srOnly}>Billing cycle</legend>
      {["monthly", "annual"].map(value => <label key={value} className={cycle === value ? styles.billingSelected : undefined}>
        <input type="radio" name={`billing-${id}`} value={value} checked={cycle === value} onChange={() => setCycle(value)} />
        {value === "monthly" ? "Monthly billing" : "Annual billing"}{value === "annual" && <span>{!PRICING.pricesConfirmed && "Proposed: "}{PRICING.annualFreeMonths} months free</span>}
      </label>)}
    </fieldset>
    <p className={styles.paymentNote}>{PRICING.paymentNote}</p>
    <div className={styles.pricingGrid}>{PLANS.map(plan => {
      const total = PRICING.pricesConfirmed ? marketingPlanAmount(plan, cycle) : null;
      const quote = `mailto:${SITE.email}?subject=${encodeURIComponent(`Fitivo ${plan.name} — ${cycle} quote request`)}`;
      return <article key={plan.id} className={`${styles.priceCard} ${plan.recommended ? styles.recommended : ""}`}>
        <div className={styles.planHeading}><h3>{plan.name}</h3>{plan.recommended && <span>For growing gyms</span>}</div>
        <p className={styles.planDescription}>{plan.description}</p>
        <div className={styles.planAmount} aria-live="polite"><span>{PRICING.currency}</span>{total === null ? <strong className={styles.unconfirmedPrice}>{PRICING.placeholderLabel}</strong> : <strong>{money(total)}<small> / {cycle === "annual" ? "year" : "month"}</small></strong>}</div>
        <p className={styles.planCycle}>{cycle === "annual" ? (PRICING.pricesConfirmed ? `Annual quote · 12 months for the price of ${12 - PRICING.annualFreeMonths}` : "Annual quote · Discount subject to confirmation") : "Monthly quote · Paid by bank transfer"}</p>
        <a className={plan.recommended ? styles.primary : styles.secondary} href={quote}>Ask about {plan.name}<ArrowRight size={16} aria-hidden="true" /></a>
        <ul className={styles.planFeatures}>{plan.highlights.map(item => <li key={item}><Check size={16} aria-hidden="true" />{item}</li>)}</ul>
        <p className={styles.planSupport}>Portal guidance & setup help included</p>
      </article>;
    })}</div>
    <p className={styles.pricingDisclaimer}>Draft plan outlines. Prices and final inclusions are confirmed with your quote. No payment is collected here.</p>
    {showDetailsLink && <div className={styles.centerLink}><Link className={styles.textLink} href="/pricing">Compare plan outlines <ArrowRight size={16} aria-hidden="true" /></Link></div>}
  </div>;
}

