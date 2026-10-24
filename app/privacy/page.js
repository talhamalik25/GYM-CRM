import Link from "next/link";

export const metadata = { title: "Privacy | Fitivo", description: "Privacy information for Fitivo." };

export default function PrivacyPage() {
  return <main className="min-h-screen bg-slate-50 px-5 py-16 text-slate-900"><article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-12"><Link href="/" className="text-sm font-bold text-indigo-600">← Fitivo home</Link><p className="mt-10 text-xs font-bold tracking-widest text-indigo-600">PRIVACY</p><h1 className="mt-3 text-4xl font-bold tracking-tight">Privacy information</h1><p className="mt-5 text-sm leading-7 text-slate-600">Fitivo has not published its privacy policy on this website yet. This page does not replace or imply a privacy policy. Please contact Fitivo through the support channel provided to your gym before relying on privacy terms.</p></article></main>;
}
