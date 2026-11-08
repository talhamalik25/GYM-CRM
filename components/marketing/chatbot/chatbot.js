"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Send } from "lucide-react";
import ChatShell, { AssistantAvatar } from "./chat-shell.js";
import LeadForm from "./lead-form.js";
import { knowledge } from "./knowledge.js";
import { matchQuestion } from "./matcher.js";
import { loadConversation, saveConversation } from "./session.js";
import { action, chip, focus } from "./styles.js";

function Answer({ topic, onNavigate }) {
  const answer = knowledge[topic];
  return <div className="flex items-start gap-2.5">
    <AssistantAvatar />
    <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-slate-200/80 bg-white px-3.5 py-3 text-sm leading-6 text-slate-700 shadow-[0_1px_2px_rgb(15_23_42/4%)]">
      <p className="whitespace-pre-line break-words">{answer.text}</p>
      {answer.bullets && <ul className="mt-2.5 list-disc space-y-1 pl-4 marker:text-indigo-400">{answer.bullets.map((text) => <li key={text} className="pl-0.5">{text}</li>)}</ul>}
      {answer.actions && <div className="mt-3 flex flex-wrap gap-2">{answer.actions.map((item) => <Link key={item.href} href={item.href} onClick={onNavigate} className={action}>{item.label}<ArrowUpRight size={13} aria-hidden="true" /></Link>)}</div>}
      <p className="mt-3 border-t border-slate-100 pt-2 text-[10px] font-medium tracking-wide text-slate-400">PUBLIC PRODUCT GUIDE</p>
    </div>
  </div>;
}

function SuggestedQuestions({ topic, onAsk }) {
  const suggestions = knowledge[topic].followups || [];
  if (!suggestions.length) return null;

  if (topic === "welcome") return <section aria-label="Suggested questions" className="space-y-2.5">
    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">A good place to start</p>
    <div className="grid grid-cols-2 gap-2">
      {suggestions.slice(0, 4).map((id) => <button
        key={id}
        type="button"
        onClick={() => onAsk(knowledge[id].label, id)}
        className={`group flex min-h-[58px] items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-xs font-medium leading-5 text-slate-700 transition-[border-color,background-color,color] hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none`}
      >
        <span>{knowledge[id].label}</span>
        <ArrowUpRight size={14} aria-hidden="true" className="shrink-0 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none" />
      </button>)}
    </div>
  </section>;

  return <section aria-label="Suggested questions" className="space-y-2">
    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">You could also ask</p>
    <div className="flex flex-wrap gap-2">
      {suggestions.slice(0, 4).map((id) => <button key={id} type="button" className={chip} onClick={() => onAsk(knowledge[id].label, id)}>{knowledge[id].label}</button>)}
    </div>
  </section>;
}

export default function MarketingChatbot() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState("");
  const panelRef = useRef(null);
  const launcherRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const timerRef = useRef(null);
  const pendingRef = useRef("");
  const loadedRef = useRef(false);
  const openRef = useRef(false);
  const latest = messages.at(-1)?.topic || "welcome";

  useEffect(() => () => clearTimeout(timerRef.current), []);
  useEffect(() => {
    if (!open || window.matchMedia("(min-width: 768px)").matches) return undefined;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = previousOverflow; };
  }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      openRef.current = false;
      launcherRef.current?.focus();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    if (window.matchMedia("(min-width: 768px)").matches) inputRef.current?.focus();
    else panelRef.current?.querySelector("#fitivo-chat-title")?.focus();
  }, [open]);
  useEffect(() => {
    if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [open, messages, pending]);

  function close() {
    setOpen(false);
    openRef.current = false;
    launcherRef.current?.focus();
  }

  function toggle() {
    if (open) { close(); return; }
    if (!loadedRef.current) {
      setMessages(loadConversation());
      loadedRef.current = true;
    }
    setOpen(true);
    openRef.current = true;
    setUnread(false);
  }

  function reset() {
    clearTimeout(timerRef.current);
    pendingRef.current = "";
    setPending("");
    setMessages([]);
    saveConversation([]);
    setQuestion("");
    if (inputRef.current) {
      inputRef.current.style.height = "";
      inputRef.current.focus();
    }
  }

  function send(text, topic) {
    const value = text.trim().slice(0, 300);
    if (!value || pendingRef.current) return;
    pendingRef.current = value;
    setQuestion("");
    if (inputRef.current) inputRef.current.style.height = "";
    setPending(value);
    timerRef.current = setTimeout(() => {
      const next = [...messages, { question: value, topic: topic || matchQuestion(value), time: Date.now() }].slice(-30);
      setMessages(next);
      saveConversation(next);
      pendingRef.current = "";
      setPending("");
      if (!openRef.current) setUnread(true);
    }, 500);
  }

  function resizeComposer(event) {
    const textarea = event.currentTarget;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 144)}px`;
    setQuestion(textarea.value);
  }

  function keyboard(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;
    const elements = [...panelRef.current.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), [tabindex="-1"]')].filter((item) => item.getClientRects().length);
    const first = elements[0]; const last = elements.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  return <ChatShell open={open} unread={unread} onToggle={toggle} onClose={close} onReset={reset} panelRef={panelRef} launcherRef={launcherRef} onKeyDown={keyboard}>
    <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain bg-slate-50/80 px-4 py-4 sm:px-5 sm:py-5">
      <Answer topic="welcome" onNavigate={close} />
      <div role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions" className="space-y-5">
        {messages.map((message, index) => <div key={`${message.time}-${index}`} className="space-y-3">
          <div className="flex justify-end">
            <p className="max-w-[88%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-md bg-primary px-3.5 py-2.5 text-sm leading-6 text-white shadow-[0_2px_5px_rgb(79_70_229/14%)]"><span className="sr-only">You: </span>{message.question}</p>
          </div>
          <Answer topic={message.topic} onNavigate={close} />
          <p className="pl-11 text-[10px] text-slate-400"><time dateTime={new Date(message.time).toISOString()}>{new Date(message.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time> · Public product guide</p>
        </div>)}
        {pending && <div className="space-y-3">
          <div className="flex justify-end"><p className="max-w-[88%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-md bg-primary px-3.5 py-2.5 text-sm leading-6 text-white">{pending}</p></div>
          <div className="flex items-center gap-2.5">
            <AssistantAvatar />
            <p role="status" className="flex min-h-10 items-center gap-2.5 rounded-2xl rounded-tl-md border border-slate-200/80 bg-white px-3.5 text-xs text-slate-500">
              <span className="flex gap-1" aria-hidden="true">{[1, 2, 3].map((dot) => <span key={dot} className="size-1.5 rounded-full bg-indigo-400 motion-safe:animate-pulse" />)}</span>
              Finding a verified answer…
            </p>
          </div>
        </div>}
      </div>
      {!pending && <div className="space-y-4">
        <SuggestedQuestions topic={latest} onAsk={send} />
        {knowledge[latest].lead && <LeadForm key={messages.length} topic={latest} />}
      </div>}
    </div>
    <footer className="shrink-0 border-t border-slate-200 bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:rounded-b-[24px] sm:px-4">
      <form onSubmit={(event) => { event.preventDefault(); send(question); }} className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 transition-[border-color,box-shadow] focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 motion-reduce:transition-none">
        <label htmlFor="fitivo-chat-question" className="sr-only">Ask a Fitivo question</label>
        <textarea
          ref={inputRef}
          id="fitivo-chat-question"
          value={question}
          onChange={resizeComposer}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              send(question);
            }
          }}
          maxLength={300}
          rows={1}
          placeholder="Ask about Fitivo…"
          autoComplete="off"
          className={`max-h-36 min-h-11 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-2.5 py-2.5 text-base leading-6 text-slate-900 placeholder:text-slate-400 focus-visible:outline-none ${focus}`}
        />
        <button type="submit" disabled={!question.trim() || !!pending} aria-label="Send question" className={`grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-white transition-[background-color,transform] hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 motion-reduce:transition-none ${focus}`}>
          <Send size={17} aria-hidden="true" />
        </button>
      </form>
      <p className="px-1 pt-2 text-center text-[10px] leading-4 text-slate-500">Public product guidance only · No account access. Please don’t share passwords or payment details.</p>
    </footer>
  </ChatShell>;
}
