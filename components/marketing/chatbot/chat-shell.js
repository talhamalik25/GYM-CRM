"use client";

import { MessageCircle, RotateCcw, X } from "lucide-react";
import FitivoLogo from "../../brand/fitivo-logo.js";
import { focus, iconButton } from "./styles.js";

export default function ChatShell({ open, unread, onToggle, onClose, onReset, panelRef, launcherRef, onKeyDown, children }) {
  return <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-[80] font-sans sm:bottom-6 sm:right-6">
    {open && <div aria-hidden="true" onClick={onClose} className="fixed inset-0 bg-slate-900/10" />}
    <section ref={panelRef} id="fitivo-chat-panel" role="dialog" aria-modal="true" aria-labelledby="fitivo-chat-title" inert={!open} aria-hidden={!open} onKeyDown={onKeyDown} className={`fixed inset-x-3 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] flex h-[min(700px,calc(100dvh-7rem))] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 shadow-2xl shadow-slate-900/20 transition-[opacity,transform,visibility] duration-200 sm:left-auto sm:right-6 sm:w-[410px] motion-reduce:transition-none ${open ? "visible translate-y-0 opacity-100" : "invisible translate-y-3 opacity-0"}`}>
      <header className="shrink-0 border-b border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2"><FitivoLogo width={92} height={31} /><div className="flex"><button type="button" onClick={onReset} className={iconButton} aria-label="Reset conversation"><RotateCcw size={17} aria-hidden="true" /></button><button type="button" onClick={onClose} className={iconButton} aria-label="Close chat"><X size={20} aria-hidden="true" /></button></div></div>
        <div className="mt-2"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-600">Your gym, explained</p><h2 id="fitivo-chat-title" className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Ask Fitivo</h2><p className="mt-1 text-xs text-slate-500">A clearer start for your gym.</p></div>
      </header>
      {children}
    </section>
    <button ref={launcherRef} type="button" aria-expanded={open} aria-controls="fitivo-chat-panel" aria-label={open ? "Close Ask Fitivo" : "Open Ask Fitivo"} onClick={onToggle} className={`relative ml-auto flex min-h-14 items-center gap-3 rounded-2xl bg-primary px-4 py-3 text-white shadow-lg shadow-indigo-900/15 transition-[transform,background-color] hover:bg-primary-hover motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none ${focus}`}>
      {open ? <X size={21} aria-hidden="true" /> : <MessageCircle size={21} aria-hidden="true" />}<span className="text-left"><span className="block text-sm font-semibold">{open ? "Close guide" : "Ask Fitivo"}</span><span className="block text-[10px] text-indigo-100">Your gym, explained.</span></span>{unread && !open && <span className="absolute right-2 top-2 size-2 rounded-full border border-primary bg-white"><span className="sr-only">New message</span></span>}
    </button>
  </div>;
}
