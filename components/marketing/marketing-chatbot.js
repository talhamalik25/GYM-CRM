"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, Send, X } from "lucide-react";
import { FAQS, SITE } from "../../config/site.js";
import FitivoLogo from "../brand/fitivo-logo.js";

const MAX_QUESTION_LENGTH = 300;

function findAnswer(question) {
  const words = question.toLowerCase().match(/[a-z0-9]+/g) || [];
  const best = FAQS.map((item) => ({
    ...item,
    score: words.reduce((score, word) => score + (
      (`${item.question} ${item.answer}`).toLowerCase().includes(word) ? 1 : 0
    ), 0),
  })).sort((a, b) => b.score - a.score)[0];
  return best?.score
    ? best.answer
    : `I can help with Fitivo’s features, trial, setup and billing information. For a specific question, contact ${SITE.company}.`;
}

export default function MarketingChatbot() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    inputRef.current?.focus();
    function closeOnEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  function sendQuestion(event) {
    event.preventDefault();
    const text = question.trim().slice(0, MAX_QUESTION_LENGTH);
    if (!text) return;
    setMessages((current) => [...current, { question: text, answer: findAnswer(text) }]);
    setQuestion("");
  }

  return <div className="fixed bottom-4 right-4 z-[60] sm:bottom-6 sm:right-6">
    {open && <section id="fitivo-help-panel" aria-label="Fitivo website help" className="mb-3 flex max-h-[min(70vh,34rem)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-lg">
      <header className="flex items-start justify-between gap-3 border-b border-line bg-primary-soft p-4">
        <div className="flex min-w-0 items-center gap-3"><FitivoLogo width={78} height={26} /><div><h2 className="font-semibold text-ink">Website help</h2><p className="mt-1 text-xs leading-5 text-ink-muted">Answers come from public Fitivo information.</p></div></div>
        <button type="button" onClick={() => setOpen(false)} className="grid size-10 shrink-0 place-items-center rounded-lg text-ink-muted hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-label="Close help"><X size={18} /></button>
      </header>
      <div className="min-h-28 flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite" aria-relevant="additions">
        {!messages.length && <p className="text-sm leading-6 text-ink-muted">Ask about features, trial requests, setup guidance, plans or billing.</p>}
        {messages.map((message, index) => <div key={index} className="space-y-2 text-sm">
          <p className="ml-6 rounded-xl bg-primary px-3 py-2 text-white">{message.question}</p>
          <p className="mr-4 rounded-xl bg-canvas px-3 py-2 leading-6 text-ink">{message.answer}</p>
        </div>)}
      </div>
      <form onSubmit={sendQuestion} className="flex items-end gap-2 border-t border-line p-3">
        <label className="sr-only" htmlFor="fitivo-help-question">Ask a question</label>
        <textarea id="fitivo-help-question" ref={inputRef} rows={2} maxLength={MAX_QUESTION_LENGTH} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a Fitivo question" className="min-h-10 min-w-0 flex-1 resize-none rounded-lg border border-line-control bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" />
        <button type="submit" disabled={!question.trim()} className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-label="Send question"><Send size={17} /></button>
      </form>
      <div className="border-t border-line px-4 py-2 text-xs text-ink-muted">Need a person? <Link href="/contact" className="font-medium text-primary underline-offset-4 hover:underline" onClick={() => setOpen(false)}>Contact AKTech</Link></div>
    </section>}
    <button type="button" aria-expanded={open} aria-controls="fitivo-help-panel" onClick={() => setOpen((value) => !value)} className="ml-auto flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-md hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      {open ? <X size={18} aria-hidden="true" /> : <MessageCircle size={18} aria-hidden="true" />}{open ? "Close help" : "Ask Fitivo"}
    </button>
  </div>;
}
