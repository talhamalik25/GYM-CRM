"use client";

import { useRef, useState } from "react";
import { ArrowRight, Check, Copy } from "lucide-react";
import { SITE } from "../../lib/marketing/site.js";
import { CONTACT_TOPICS } from "../../lib/marketing/pages.js";
import styles from "./marketing-pages.module.css";

// TODO: Connect a dedicated inquiry/trial-review backend when authorized.
// This form only prepares an email. It does not submit data or create accounts.
export default function MarketingInquiryForm({ trial = false }) {
  const [draft, setDraft] = useState(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [error, setError] = useState("");
  const nameRef = useRef(null);
  const gymRef = useRef(null);
  const messageRef = useRef(null);
  const prefix = trial ? "trial" : "contact";

  function prepare(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const gym = String(data.get("gym") || "").trim();
    const message = String(data.get("message") || "").trim();
    if (!name || (trial && !gym) || (!trial && !message)) {
      setError("Please complete the required fields with more than spaces.");
      (!name ? nameRef : trial && !gym ? gymRef : messageRef).current?.focus();
      return;
    }
    const subject = trial ? SITE.trial.requestSubject : `Fitivo inquiry: ${data.get("topic")}`;
    const body = [
      trial ? `I would like to request a ${SITE.trial.days}-day Fitivo trial.` : "Hello AKTech,",
      "", `Name: ${name}`, `Email: ${email}`, `Gym: ${gym || "Not provided"}`,
      ...(trial ? [`City: ${String(data.get("city") || "").trim() || "Not provided"}`] : [`Topic: ${data.get("topic")}`]),
      "", message,
      ...(trial ? ["", "I understand that access requires approval."] : []),
    ].join("\n");
    setDraft({ subject, body, href: `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` });
    setError("");
    setCopyStatus("");
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(`To: ${SITE.email}\nSubject: ${draft.subject}\n\n${draft.body}`);
      setCopyStatus("Draft copied. Paste it into your email app and send it to AKTech.");
    } catch {
      setCopyStatus("Copy is unavailable here. Select the draft text below and copy it manually.");
    }
  }

  return <div className={styles.formCard}>
    <p className={styles.eyebrow}>{trial ? "Your trial request" : "Start a conversation"}</p>
    <h2>{trial ? "Tell us about your gym." : "What can we help with?"}</h2>
    <p className={styles.formIntro}>Prepare an email below, then review and send it in your email app.</p>
    <form action={"mailto:" + SITE.email} method="post" encType="text/plain" onSubmit={prepare} onChange={() => { setDraft(null); setError(""); setCopyStatus(""); }}>
      <div className={styles.formGrid}>
        <label htmlFor={`${prefix}-name`}>Your name<input ref={nameRef} id={`${prefix}-name`} name="name" autoComplete="name" required maxLength={100} /></label>
        <label htmlFor={`${prefix}-email`}>Email address<input id={`${prefix}-email`} name="email" type="email" autoComplete="email" required maxLength={254} /></label>
        <label htmlFor={`${prefix}-gym`}>Gym name{!trial && " (optional)"}<input ref={gymRef} id={`${prefix}-gym`} name="gym" autoComplete="organization" required={trial} maxLength={120} /></label>
        {trial ? <label htmlFor={`${prefix}-city`}>City (optional)<input id={`${prefix}-city`} name="city" autoComplete="address-level2" maxLength={100} /></label> : <label htmlFor={`${prefix}-topic`}>How can we help?<select id={`${prefix}-topic`} name="topic">{CONTACT_TOPICS.map(topic => <option key={topic}>{topic}</option>)}</select></label>}
      </div>
      <label htmlFor={`${prefix}-message`}>{trial ? "Anything we should know? (optional)" : "Your message"}<textarea ref={messageRef} id={`${prefix}-message`} name="message" required={!trial} maxLength={800} rows={5} placeholder={trial ? "Your gym setup and what you would like to explore." : "A little context will help us reply."} /></label>
      {error && <p className={styles.formError} role="alert">{error}</p>}
      <button className={styles.primary} type="submit">Prepare {trial ? "trial request" : "email"}<ArrowRight size={16} aria-hidden="true" /></button>
      <p className={styles.note}>{trial ? "No payment details or password needed. Access is arranged only after approval." : "Your message stays on this page until you choose to send it through your email app."}</p>
    </form>
    {draft && <div className={styles.draft}>
      <p role="status"><Check size={17} aria-hidden="true" />Draft ready. It has not been sent.</p>
      <label htmlFor={`${prefix}-draft`}>Review your email<textarea id={`${prefix}-draft`} readOnly rows={8} value={`To: ${SITE.email}\nSubject: ${draft.subject}\n\n${draft.body}`} /></label>
      <div className={styles.actions}><a className={styles.primary} href={draft.href}>Open email app<ArrowRight size={16} aria-hidden="true" /></a><button type="button" className={styles.secondary} onClick={copyDraft}><Copy size={15} aria-hidden="true" />Copy draft</button></div>
      <p className={styles.note}>Send the email to complete your request. If your email app doesn’t open, copy the draft and email {SITE.email}.</p>
      <p className={styles.note} role="status">{copyStatus}</p>
    </div>}
  </div>;
}
