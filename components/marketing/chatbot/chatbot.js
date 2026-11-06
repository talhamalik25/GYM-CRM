"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import ChatShell from "./chat-shell.js";
import LeadForm from "./lead-form.js";
import { knowledge } from "./knowledge.js";
import { matchQuestion } from "./matcher.js";
import { loadConversation, saveConversation } from "./session.js";
import { action, chip, focus } from "./styles.js";

function Answer({ topic, onNavigate }) {
  const answer = knowledge[topic];
  return <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-3.5 text-sm leading-6 text-slate-700">
    <p>{answer.text}</p>
    {answer.bullets && <ul className="mt-2 list-disc space-y-1 pl-4">{answer.bullets.map((text) => <li key={text}>{text}</li>)}</ul>}
    {answer.actions && <div className="mt-3 flex flex-wrap gap-2">{answer.actions.map((item) => <Link key={item.href} href={item.href} onClick={onNavigate} className={action}>{item.label}</Link>)}</div>}
  </div>;
}

export default function MarketingChatbot() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(true);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState("");
  const panelRef = useRef(null);
  const launcherRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const timerRef = useRef(null);
  const loadedRef = useRef(false);
  const openRef = useRef(false);
  const latest = messages.at(-1)?.topic || "welcome";

  useEffect(() => () => clearTimeout(timerRef.current), []);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => { if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [open, messages, pending]);

  function close() { setOpen(false); openRef.current = false; launcherRef.current?.focus(); }
  function toggle() {
    if (open) { close(); return; }
    if (!loadedRef.current) { setMessages(loadConversation()); loadedRef.current = true; }
    setOpen(true); openRef.current = true; setUnread(false);
  }
  function reset() {
    clearTimeout(timerRef.current); setPending(""); setMessages([]); saveConversation([]); setQuestion(""); inputRef.current?.focus();
  }
  function send(text, topic) {
    const value = text.trim().slice(0, 300);
    if (!value || pending) return;
    setQuestion(""); setPending(value);
    inputRef.current?.focus();
    timerRef.current = setTimeout(() => {
      const next = [...messages, { question: value, topic: topic || matchQuestion(value), time: Date.now() }].slice(-30);
      setMessages(next); saveConversation(next); setPending("");
      if (!openRef.current) setUnread(true);
    }, 650);
  }
  function keyboard(event) {
    if (event.key === "Escape") { event.preventDefault(); close(); }
    if (event.key !== "Tab") return;
    const elements = [...panelRef.current.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled)')].filter((item) => item.getClientRects().length);
    const first = elements[0]; const last = elements.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  return <ChatShell open={open} unread={unread} onToggle={toggle} onClose={close} onReset={reset} panelRef={panelRef} launcherRef={launcherRef} onKeyDown={keyboard}>
    <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
      <Answer topic="welcome" onNavigate={close} />
      <div role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions" className="space-y-4">
        {messages.map((message, index) => <div key={`${message.time}-${index}`} className="space-y-2">
          <p className="ml-9 break-words rounded-2xl rounded-tr-sm bg-primary px-3.5 py-3 text-sm leading-6 text-white"><span className="sr-only">You: </span>{message.question}</p>
          <Answer topic={message.topic} onNavigate={close} />
          <p className="text-[10px] text-slate-500"><time dateTime={new Date(message.time).toISOString()}>{new Date(message.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time> · Fitivo guide</p>
        </div>)}
        {pending && <div className="space-y-3"><p className="ml-9 break-words rounded-2xl bg-primary px-3.5 py-3 text-sm text-white">{pending}</p><p role="status" className="flex items-center gap-2 text-xs text-slate-500"><span className="flex gap-1" aria-hidden="true">{[1, 2, 3].map((dot) => <span key={dot} className="size-1.5 rounded-full bg-indigo-400 motion-safe:animate-pulse" />)}</span>Fitivo is typing…</p></div>}
      </div>
      {!pending && <><div className="flex flex-wrap gap-2" aria-label="Suggested questions">{knowledge[latest].followups?.map((id) => <button key={id} type="button" className={chip} onClick={() => send(knowledge[id].label, id)}>{knowledge[id].label}</button>)}</div>{knowledge[latest].lead && <LeadForm key={messages.length} topic={latest} />}</>}
    </div>
    <footer className="shrink-0 border-t border-slate-200 bg-white p-3">
      <form onSubmit={(event) => { event.preventDefault(); send(question); }} className="flex items-center gap-2">
        <label htmlFor="fitivo-chat-question" className="sr-only">Ask a Fitivo question</label>
        <input ref={inputRef} id="fitivo-chat-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={300} placeholder="What would you like to know?" autoComplete="off" className={`min-h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-base text-slate-900 placeholder:text-slate-500 ${focus}`} />
        <button type="submit" disabled={!question.trim() || !!pending} aria-label="Send question" className={`grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-40 ${focus}`}><Send size={18} aria-hidden="true" /></button>
      </form>
      <p className="mt-2 text-center text-[10px] leading-4 text-slate-500">Public product guidance · No account access<br />Please don’t share passwords or payment details.</p>
    </footer>
  </ChatShell>;
}
