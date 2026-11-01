"use client";

import Link from "next/link";
import FitivoLogo from "../components/brand/fitivo-logo.js";

export default function ErrorPage({ reset }) {
  return <main className="flex min-h-screen items-center justify-center bg-canvas px-5 py-16 text-ink">
    <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-8 text-center shadow-sm sm:p-12">
      <Link href="/" className="inline-flex" aria-label="Fitivo home"><FitivoLogo width={132} height={44} /></Link>
      <p className="mt-10 text-sm font-semibold uppercase tracking-[0.14em] text-primary">Something went wrong</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">We couldn’t load this page.</h1>
      <p className="mt-3 text-sm leading-6 text-ink-muted">Try again, or return to the Fitivo home page.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => reset()} className="inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Try again</button>
        <Link href="/" className="inline-flex min-h-11 items-center rounded-lg border border-line px-5 text-sm font-semibold text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Go to home</Link>
      </div>
    </div>
  </main>;
}
