"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Clock3, ImagePlus, ShieldCheck, X } from "lucide-react";
import { BANK } from "../../lib/marketing/bank.js";
import { PLANS, PRICING, marketingPlanAmount } from "../../lib/marketing/plans.js";
import { SITE } from "../../lib/marketing/site.js";
import shared from "./marketing-pages.module.css";
import styles from "./marketing-payment.module.css";

const bankFields = [["BANK_NAME", "Bank name"], ["ACCOUNT_TITLE", "Account title"], ["ACCOUNT_NUMBER", "Account number"], ["IBAN", "IBAN"]];
const bankReady = BANK.configured && bankFields.every(([key]) => typeof BANK[key] === "string" && BANK[key].trim() && BANK[key].trim() !== key);
const maxFileSize = 5 * 1024 * 1024;
const imageTypes = ["image/png", "image/jpeg", "image/webp"];

export default function MarketingPayment({ initialPlan, initialCycle, invalidSelection }) {
  const [planId, setPlanId] = useState(initialPlan);
  const [cycle, setCycle] = useState(initialCycle);
  const [preview, setPreview] = useState(null);
  const [fileError, setFileError] = useState("");
  const [fileStatus, setFileStatus] = useState("");
  const inputRef = useRef(null);
  const objectUrl = useRef(null);
  const plan = PLANS.find(item => item.id === planId) || PLANS[0];
  const amount = PRICING.pricesConfirmed ? marketingPlanAmount(plan, cycle) : null;
  const quoteReady = amount !== null;
  const quoteHref = `mailto:${SITE.email}?subject=${encodeURIComponent(`Fitivo ${plan.name} — ${cycle} quote request`)}&body=${encodeURIComponent(`Hello AKTech,\n\nPlease confirm the ${cycle} PKR quote, final inclusions and bank transfer instructions for the Fitivo ${plan.name} plan.\n\nGym name:\nContact name:\n`)}`;

  useEffect(() => () => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  function clearPreview() {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function selectFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    clearPreview();
    setFileError("");
    setFileStatus("");
    if (!imageTypes.includes(file.type)) {
      setFileError("Choose a PNG, JPG or WebP image.");
      return;
    }
    if (!file.size || file.size > maxFileSize) {
      setFileError("Choose a non-empty image no larger than 5 MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    objectUrl.current = url;
    setPreview({ url, name: file.name, size: `${Math.max(1, Math.round(file.size / 1024))} KB` });
    setFileStatus("Screenshot selected for local preview. Nothing has been uploaded or submitted.");
  }

  function changeSelection(update) {
    update();
    if (preview) {
      clearPreview();
      setFileStatus("Selection changed. The previous screenshot preview has been cleared.");
    }
    setFileError("");
  }

  return <section className={shared.section} aria-label="Payment details"><div className={shared.container}>
    <div className={styles.notice}><ShieldCheck size={21} aria-hidden="true" /><div><strong>{quoteReady && bankReady ? "Confirm your invoice before transferring." : "Confirm the details before paying."}</strong><p>{!quoteReady && "Plan prices are awaiting confirmation. "}{!bankReady && "Bank details below are placeholders. "}Contact AKTech for your confirmed quote and transfer instructions. Screenshot submission is not available on this page yet.</p></div></div>
    {invalidSelection && <p className={styles.selectionNotice}>The link contained an unrecognized plan or billing cycle. Review the selection below before continuing.</p>}
    <div className={styles.layout}><div className={styles.steps}>
      <section className={styles.card} aria-labelledby="choose-plan"><div className={styles.stepHeading}><span>01</span><h2 id="choose-plan">Choose your plan</h2></div><p className={styles.description}>Select the plan and billing period to discuss with AKTech.</p>
        <div className={styles.controls}><label htmlFor="payment-plan">Fitivo plan<select id="payment-plan" value={plan.id} onChange={event => changeSelection(() => setPlanId(event.target.value))}>{PLANS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <fieldset className={styles.cycle}><legend>Billing period</legend>{["monthly", "annual"].map(value => <label key={value}><input type="radio" name="payment-cycle" value={value} checked={cycle === value} onChange={() => changeSelection(() => setCycle(value))} />{value === "monthly" ? "Monthly" : "Annual"}</label>)}</fieldset></div>
        <p className={styles.selectionAmount} aria-live="polite">{PRICING.currency} · {quoteReady ? `${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(amount)} per ${cycle === "annual" ? "year" : "month"}` : PRICING.placeholderLabel}</p>
        <p className={styles.note}>{cycle === "annual" ? `${PRICING.pricesConfirmed ? "" : "Proposed: "}${PRICING.annualFreeMonths} months free with annual billing.${PRICING.pricesConfirmed ? "" : " Subject to confirmation."}` : "One monthly subscription, paid by bank transfer."}</p>
        <Link href="/pricing#comparison" className={shared.textLink}>Compare plan outlines <ArrowRight size={15} aria-hidden="true" /></Link>
      </section>
      <section className={styles.card} aria-labelledby="bank-details"><div className={styles.stepHeading}><span>02</span><h2 id="bank-details">Review the bank details</h2><Building2 size={20} aria-hidden="true" /></div><p className={styles.description}>{bankReady ? "Use the confirmed invoice amount and verify these details with AKTech before transferring." : "Placeholder details · Do not use these to make a transfer."}</p>
        <dl className={styles.bankDetails}>{bankFields.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{BANK[key]}</dd></div>)}</dl>
        <p className={styles.note}>This payment is for your gym’s Fitivo subscription. Member fees are recorded separately inside your gym workspace.</p>
      </section>
      <section className={styles.card} aria-labelledby="payment-screenshot"><div className={styles.stepHeading}><span>03</span><h2 id="payment-screenshot">Payment screenshot</h2></div><p className={styles.description}>After a confirmed transfer, a screenshot helps the team identify your payment. For now, you can only preview an image on your device.</p>
        <div className={styles.upload}><ImagePlus size={28} aria-hidden="true" /><label htmlFor="payment-file">Choose a screenshot to preview</label><p id="payment-file-help">PNG, JPG or WebP · Up to 5 MB. The image stays in this browser tab and is cleared when you leave or reload.</p><input ref={inputRef} id="payment-file" type="file" accept="image/png,image/jpeg,image/webp" aria-describedby={`payment-file-help${fileError ? " payment-file-error" : ""}`} aria-invalid={Boolean(fileError)} onChange={selectFile} /></div>
        {fileError && <p id="payment-file-error" className={styles.error} role="alert">{fileError}</p>}
        <p className={styles.fileStatus} role="status">{fileStatus}</p>
        {preview && <figure className={styles.preview}>
          {/* A temporary browser blob is never sent to an image optimizer or server. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview.url} alt="Local preview of the selected payment screenshot" onError={() => { clearPreview(); setFileStatus(""); setFileError("This image could not be opened. Choose another PNG, JPG or WebP image."); }} />
          <figcaption><div><strong>{preview.name}</strong><span>{preview.size} · Local preview only</span></div><button type="button" className={styles.remove} onClick={() => { clearPreview(); setFileError(""); setFileStatus("Screenshot preview removed. Nothing was uploaded."); inputRef.current?.focus(); }} aria-label="Remove screenshot preview"><X size={17} aria-hidden="true" /></button></figcaption>
        </figure>}
        {/* TODO: Connect authenticated screenshot storage, invoice association and
            manual review before enabling submission. BANK.screenshotUploadAvailable
            is informational; changing it alone must never enable a fake submission. */}
        <button type="button" className={styles.submit} disabled aria-describedby="submission-unavailable">Submit for verification</button>
        <p id="submission-unavailable" className={styles.note}>Screenshot submission is not connected yet. Existing gym owners can <Link href="/billing">open Plan & billing</Link> to submit a payment reference against their invoice.</p>
        <noscript><p className={styles.note}>Enable JavaScript to change the selection and preview an image. You can still contact AKTech using the quote link.</p></noscript>
      </section>
      <section className={`${styles.card} ${styles.review}`} aria-labelledby="manual-review"><div className={styles.stepHeading}><span>04</span><h2 id="manual-review">Manual review & activation</h2></div><p className={styles.description}>Once your payment details have been submitted through the supported billing process, allow up to {BANK.reviewWindowHours} hours for the team to review them.</p><p className={styles.activation}><ShieldCheck size={19} aria-hidden="true" />{BANK.activationNote}</p></section>
    </div>
    <aside className={styles.summary} aria-labelledby="quote-summary"><p className={shared.eyebrow}>Your selection</p><div aria-live="polite" aria-atomic="true"><h2 id="quote-summary">{plan.name}</h2><p className={styles.description}>{plan.description}</p><div className={styles.summaryLine}><span>Billing period</span><strong>{cycle === "annual" ? "Annual" : "Monthly"}</strong></div><div className={styles.amount}><span>{quoteReady ? "Quoted amount" : "Quote status"} · {PRICING.currency}</span><strong>{quoteReady ? new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(amount) : PRICING.placeholderLabel}</strong><small>{quoteReady ? `Per ${cycle === "annual" ? "year" : "month"} · Confirm against your invoice` : "No payable amount has been issued here."}</small></div></div>
      <a href={quoteHref} className={shared.primary}>Request a confirmed quote <ArrowRight size={16} aria-hidden="true" /></a><p className={styles.note}>Opens your email app. AKTech will confirm the amount, inclusions and transfer instructions with you.</p><div className={styles.reviewNote}><Clock3 size={19} aria-hidden="true" /><p>Manual review within {BANK.reviewWindowHours} hours of submission.<br />Access begins after verification.</p></div><Link href="/contact" className={shared.textLink}>Need help with payment? <ArrowRight size={15} aria-hidden="true" /></Link>
    </aside></div>
  </div></section>;
}
