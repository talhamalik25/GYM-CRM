import Link from "next/link";

export const metadata = { title: "Terms | Fitivo", description: "Terms information for Fitivo." };

export default function TermsPage() {
  return <main className="min-h-screen bg-slate-50 px-5 py-16 text-slate-900"><article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-12"><Link href="/" className="text-sm font-bold text-indigo-600">← Fitivo home</Link><p className="mt-10 text-xs font-bold tracking-widest text-indigo-600">TERMS</p><h1 className="mt-3 text-4xl font-bold tracking-tight">Terms of service</h1><p className="mt-5 text-sm leading-7 text-slate-600">Fitivo has not published its terms of service on this website yet. This page does not create or summarize service terms. Please contact Fitivo through the support channel provided to your gym before relying on terms of service.</p></article></main>;
}
