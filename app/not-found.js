import Link from "next/link";
import FitivoLogo from "../components/brand/fitivo-logo.js";

export default function NotFound() {
  return <main className="flex min-h-screen items-center justify-center bg-canvas px-5 py-16 text-ink">
    <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-8 text-center shadow-sm sm:p-12">
      <Link href="/" className="inline-flex" aria-label="Fitivo home"><FitivoLogo width={132} height={44} /></Link>
      <p className="mt-10 text-sm font-semibold uppercase tracking-[0.14em] text-primary">404 · Page not found</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">This page isn’t here.</h1>
      <p className="mt-3 text-sm leading-6 text-ink-muted">Check the address or return to the Fitivo home page.</p>
      <Link href="/" className="mt-7 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Go to home</Link>
    </div>
  </main>;
}
