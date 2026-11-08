import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Dumbbell, LockKeyhole } from "lucide-react";
import FitivoLogo from "../brand/fitivo-logo.js";

export const authFormClasses = "mt-8 grid gap-5 [&_.ui-input]:min-h-12 [&_.ui-input]:rounded-xl [&_.ui-input]:text-base [&_.ui-input]:px-4 [&_.ui-label]:text-sm [&_.ui-field-hint]:text-xs motion-reduce:[&_*]:transition-none motion-reduce:[&_*]:animate-none";
export const authActionClasses = "w-full min-h-12! rounded-xl! text-sm! motion-safe:transition-transform motion-safe:active:scale-[0.99]";
export const authLinkClasses = "rounded font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand";
export const authErrorClasses = "rounded-xl border border-error/20 bg-error-soft px-4 py-3 text-sm leading-6 text-error";

function FitnessComposition() {
  return <div className="relative mx-auto my-10 grid h-64 w-full max-w-sm place-items-center xl:h-72" aria-hidden="true">
    <div className="absolute inset-x-8 inset-y-0 rounded-full border border-white/10" />
    <div className="absolute inset-x-16 inset-y-8 rounded-full border border-white/15" />
    <div className="absolute inset-x-24 inset-y-16 rounded-full bg-indigo-400/10" />
    <div className="relative flex -rotate-[25deg] items-center">
      <div className="h-20 w-5 rounded-lg border border-white/30 bg-indigo-200/20 shadow-xl" />
      <div className="h-36 w-10 rounded-xl border border-indigo-200/50 bg-linear-to-r from-indigo-200/40 to-indigo-400/20 shadow-xl" />
      <div className="h-12 w-16 border-y border-white/40 bg-linear-to-b from-white/50 via-white/15 to-indigo-300/20" />
      <div className="h-36 w-10 rounded-xl border border-indigo-200/50 bg-linear-to-r from-indigo-200/40 to-indigo-400/20 shadow-xl" />
      <div className="h-20 w-5 rounded-lg border border-white/30 bg-indigo-200/20 shadow-xl" />
    </div>
    <span className="absolute left-0 top-7 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium tracking-wide text-indigo-100">CONSISTENCY</span>
    <span className="absolute bottom-6 right-0 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium tracking-wide text-indigo-100">PROGRESS</span>
  </div>;
}

export default function AuthLayout({ children, title, description, eyebrow, titleId, compact = false }) {
  return <main className="grid min-h-svh bg-white font-sans text-ink lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] motion-reduce:[&_*]:transition-none motion-reduce:[&_*]:animate-none">
    <aside className="relative hidden flex-col overflow-hidden bg-slate-950 p-10 text-white lg:flex xl:p-14" aria-label="Fitivo gym workspace">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-indigo-950 via-slate-950 to-indigo-900/70" aria-hidden="true" />
      <div className="relative flex items-center justify-between gap-4">
        <Link href="/" aria-label="Fitivo home" className="rounded-lg bg-white p-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-300"><FitivoLogo width={120} height={40} priority /></Link>
        <span className="text-xs font-medium tracking-wide text-indigo-200">THE GYM WORKSPACE</span>
      </div>
      <div className="relative my-auto py-10">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200"><Dumbbell size={16} aria-hidden="true" />Built for the business of fitness</p>
        <h2 className="mt-6 max-w-lg text-[42px] font-semibold leading-[1.12] tracking-tight xl:text-5xl">More focus on<br />your gym.<br /><span className="text-indigo-300">Less on the admin.</span></h2>
        <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">Bring your members, memberships and daily operations into one connected workspace.</p>
        <FitnessComposition />
        <div className="flex flex-wrap gap-x-5 gap-y-3 border-t border-white/15 pt-6 text-sm text-slate-200">{["Members", "Attendance", "Payments"].map((label) => <span key={label} className="flex items-center gap-2"><span className="size-1 rounded-full bg-indigo-300" />{label}</span>)}</div>
      </div>
      <p className="relative flex items-center justify-between text-xs text-slate-400"><span>Your gym, in sync.</span><ArrowUpRight size={16} aria-hidden="true" /></p>
    </aside>
    <section className="flex min-w-0 flex-col px-6 py-6 sm:px-10 sm:py-8 lg:px-12 xl:px-20" aria-labelledby={titleId}>
      <header className="flex items-center justify-between gap-4">
        <Link href="/" aria-label="Fitivo home" className="rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand lg:invisible lg:pointer-events-none lg:hidden"><FitivoLogo width={112} height={38} priority /></Link>
        <Link href="/" className="ml-auto inline-flex min-h-11 items-center gap-2 rounded text-sm text-ink-muted hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"><ArrowLeft size={15} aria-hidden="true" />Back to home</Link>
      </header>
      <div className={`mx-auto my-auto w-full max-w-[420px] ${compact ? "py-8 sm:py-10" : "py-12 sm:py-16"}`}>
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand">{eyebrow}</p>
        <h1 id={titleId} className="text-[32px] font-semibold leading-tight tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">{description}</p>
        {children}
      </div>
      <footer className="mx-auto flex w-full max-w-[420px] flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line pt-5 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1.5"><LockKeyhole size={13} aria-hidden="true" />Fitivo · {new Date().getFullYear()}</span>
        <div className="flex gap-4"><Link className="inline-flex min-h-11 items-center rounded hover:text-brand focus-visible:outline-2 focus-visible:outline-brand" href="/privacy">Privacy</Link><Link className="inline-flex min-h-11 items-center rounded hover:text-brand focus-visible:outline-2 focus-visible:outline-brand" href="/terms">Terms</Link></div>
      </footer>
    </section>
  </main>;
}
