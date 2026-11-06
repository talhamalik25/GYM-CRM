"use client";
import { useState } from "react";
import { validateMarketingLead } from "../../../lib/marketingLead.js";
import { action, focus } from "./styles.js";

export default function LeadForm({ topic }) {
  const [expanded, setExpanded] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  async function submit(event) {
    event.preventDefault();
    if (status === "sending") return;
    const form = new FormData(event.currentTarget);
    const values = { name: form.get("name"), gymName: form.get("gymName"), phone: form.get("phone"), consent: form.get("consent") === "on", topic };
    const result = validateMarketingLead(values);
    setErrors(result.errors);
    if (Object.keys(result.errors).length) { setMessage("Please check the highlighted details."); return; }
    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/marketing/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values), signal: AbortSignal.timeout(15000) });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setErrors(body.error?.fields || {});
        throw new Error(body.error?.message || "We couldn’t save your request.");
      }
      setStatus("success");
      setMessage("Your request has been saved for the team. Thank you.");
    } catch (error) {
      setStatus("error");
      setMessage(error.name === "TimeoutError" ? "The request timed out. Contact the team if you’re unsure it was received." : "We couldn’t save your request. Please try again or use Contact Us above.");
    }
  }
  if (!expanded) return <button type="button" className={`${action} mt-3`} onClick={() => setExpanded(true)}>Want the team to contact you?</button>;
  return <form onSubmit={submit} noValidate className="mt-3 space-y-3 rounded-xl border border-indigo-100 bg-white p-3">
    <p className="text-sm font-semibold text-slate-900">Let’s talk about your gym</p>
    <p className="text-xs leading-5 text-slate-500">Optional. Share your details so the Fitivo team can contact you about this enquiry. These details aren’t saved in chat history.</p>
    {status !== "success" && <><fieldset disabled={status === "sending"} className="space-y-3 disabled:opacity-60">
      {[{ name: "name", label: "Your name", max: 80, auto: "name" }, { name: "gymName", label: "Gym name", max: 120, auto: "organization" }, { name: "phone", label: "Phone", max: 30, auto: "tel" }].map((field) => <div key={field.name}><label htmlFor={`chat-lead-${field.name}`} className="mb-1 block text-xs font-medium text-slate-700">{field.label}</label><input id={`chat-lead-${field.name}`} name={field.name} type={field.name === "phone" ? "tel" : "text"} autoComplete={field.auto} maxLength={field.max} required aria-invalid={!!errors[field.name]} aria-describedby={errors[field.name] ? `chat-error-${field.name}` : undefined} className={`min-h-11 w-full rounded-lg border border-slate-300 px-3 text-base text-slate-900 ${focus}`} />{errors[field.name] && <p id={`chat-error-${field.name}`} className="mt-1 text-xs text-red-700">{errors[field.name]}</p>}</div>)}
      <label className="flex min-h-11 items-start gap-2 text-xs leading-5 text-slate-600"><input type="checkbox" name="consent" className={`mt-1 size-4 shrink-0 accent-indigo-600 ${focus}`} aria-invalid={!!errors.consent} aria-describedby={errors.consent ? "chat-error-consent" : undefined} />I agree that the Fitivo team may contact me about this enquiry.</label>
      {errors.consent && <p id="chat-error-consent" className="text-xs text-red-700">{errors.consent}</p>}
      <button type="submit" className={action}>{status === "sending" ? "Sending…" : "Send my request"}</button>
    </fieldset></>}
    <p role="status" className={`text-xs leading-5 ${status === "error" ? "text-red-700" : "text-slate-700"}`}>{message}</p>
  </form>;
}
