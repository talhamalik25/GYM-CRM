"use client";

import { Minus, RotateCcw, Sparkles, X } from "lucide-react";
import { focus, iconButton } from "./styles.js";

export function AssistantAvatar({ size = "md" }) {
  const sizeClass = size === "lg" ? "size-12 rounded-2xl" : "size-9 rounded-xl";
  const iconSize = size === "lg" ? 22 : 18;
  return <span className={`grid shrink-0 place-items-center border border-indigo-100 bg-indigo-50 text-indigo-600 ${sizeClass}`}>
    <Sparkles size={iconSize} strokeWidth={1.8} aria-hidden="true" />
  </span>;
}

export default function ChatShell({ open, unread, onToggle, onClose, onReset, panelRef, launcherRef, onKeyDown, children }) {
  return <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-[80] font-sans sm:bottom-6 sm:right-6">
    {open && <button type="button" aria-label="Close Fitivo Assistant" tabIndex={-1} onClick={onClose} className="fixed inset-0 z-0 hidden cursor-default bg-slate-950/10 backdrop-blur-[1px] sm:block" />}
    <section
      ref={panelRef}
      id="fitivo-chat-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fitivo-chat-title"
      inert={!open}
      aria-hidden={!open}
      onKeyDown={onKeyDown}
      className={`fixed inset-0 z-10 flex h-[100dvh] w-full flex-col overflow-hidden border-0 border-slate-200 bg-slate-50 opacity-0 shadow-none transition-[opacity,transform,visibility] duration-300 ease-out invisible translate-y-3 sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[min(680px,calc(100dvh-7rem))] sm:w-[min(420px,calc(100vw-3rem))] sm:origin-bottom-right sm:rounded-[24px] sm:border sm:shadow-2xl sm:shadow-slate-900/15 motion-reduce:transition-none ${open ? "visible translate-y-0 opacity-100 sm:scale-100" : "pointer-events-none sm:scale-[0.98]"}`}
    >
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:rounded-t-[24px] sm:pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <AssistantAvatar size="lg" />
            <div className="min-w-0">
              <h2 id="fitivo-chat-title" tabIndex={-1} className="truncate text-[15px] font-semibold tracking-tight text-slate-900 focus-visible:outline-none">Fitivo Assistant</h2>
              <p className="mt-0.5 truncate text-xs text-slate-500">Public product guide · no account access</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={onReset} className={iconButton} aria-label="Start a new conversation"><RotateCcw size={17} aria-hidden="true" /></button>
            <button type="button" onClick={onClose} className={`${iconButton} sm:hidden`} aria-label="Minimize Fitivo Assistant"><Minus size={19} aria-hidden="true" /></button>
            <button type="button" onClick={onClose} className={`${iconButton} max-sm:hidden`} aria-label="Close Fitivo Assistant"><X size={19} aria-hidden="true" /></button>
          </div>
        </div>
      </header>
      {children}
    </section>
    <button
      ref={launcherRef}
      type="button"
      aria-hidden={open}
      aria-expanded={open}
      aria-controls="fitivo-chat-panel"
      aria-label={open ? "Close Fitivo Assistant" : "Ask Fitivo Assistant"}
      onClick={onToggle}
      className={`group relative z-20 ml-auto flex size-14 items-center justify-center rounded-full border border-white bg-primary p-1.5 text-white shadow-[0_8px_24px_-12px_rgb(30_41_59/45%),0_2px_8px_rgb(79_70_229/18%)] transition-[transform,background-color,box-shadow,opacity] duration-200 hover:scale-[1.03] hover:bg-primary-hover hover:shadow-[0_10px_28px_-10px_rgb(30_41_59/48%),0_3px_10px_rgb(79_70_229/22%)] active:scale-[0.98] sm:h-14 sm:w-auto sm:justify-start sm:gap-2.5 sm:rounded-2xl sm:py-1.5 sm:pl-1.5 sm:pr-4 motion-reduce:transition-none ${open ? "pointer-events-none scale-90 opacity-0" : ""} ${focus}`}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10">
        {open ? <X size={21} strokeWidth={1.8} aria-hidden="true" /> : <Sparkles size={21} strokeWidth={1.8} aria-hidden="true" />}
      </span>
      <span className="hidden text-left sm:block">
        <span className="block text-sm font-semibold tracking-tight">Ask Fitivo</span>
        <span className="mt-0.5 block text-[10px] leading-none text-indigo-100">Product guide</span>
      </span>
      {unread && !open && <span className="absolute right-0 top-0 size-3 rounded-full border-2 border-white bg-emerald-500"><span className="sr-only">New reply</span></span>}
    </button>
  </div>;
}
