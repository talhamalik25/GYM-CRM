"use client";

import { useState } from "react";
import { Building2, Check, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../ui/button";
import Card from "../ui/card";
import Input from "../ui/input";
import MarketingProductPreview from "../marketing/marketing-product-preview.js";
import { MarketingBrand, MarketingPrimaryAction } from "../marketing/marketing-primitives.js";

const initialValues = { fullName: "", email: "", password: "", gymName: "" };

function RegistrationClosed() {
  return <main className="grid min-h-screen bg-canvas lg:grid-cols-2">
    <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
      <div className="w-full max-w-[480px]"><MarketingBrand className="mb-10" /><Card className="p-6 sm:p-9"><div className="mb-7 grid size-12 place-items-center rounded-xl bg-brand-soft text-brand"><Building2 size={23} aria-hidden="true" /></div><p className="text-xs font-bold uppercase tracking-[.15em] text-brand">Fitivo access</p><h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Registration is currently closed</h1><p className="mt-3 text-sm leading-6 text-ink-muted">New gym accounts are not being accepted right now. You can request access or sign in if you already have an account.</p><div className="mt-7 flex flex-wrap gap-3"><MarketingPrimaryAction trialAvailable={false} /><Link href="/login" className="inline-flex min-h-11 items-center justify-center rounded-input border border-line px-4 text-sm font-semibold text-ink hover:bg-canvas">Sign in</Link></div></Card><p className="mt-6 text-center text-xs text-ink-muted">Fitivo · Gym management workspace</p></div>
    </section>
    <aside className="relative hidden min-h-screen flex-col justify-center overflow-hidden bg-ink p-8 text-white lg:flex xl:p-14"><div className="absolute -right-24 -top-24 size-96 rounded-full bg-brand/20 blur-2xl" aria-hidden="true" /><div className="relative mx-auto w-full max-w-xl"><MarketingBrand inverse className="mb-12" /><h2 className="max-w-lg text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">Your gym, in sync.</h2><p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">A connected workspace for member records, memberships, attendance, payments, and reports.</p><div className="mt-9"><MarketingProductPreview compact /></div></div></aside>
  </main>;
}

export default function RegisterForm({ registrationAvailable = false, trialPlanName = "" }) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!registrationAvailable) return <RegistrationClosed />;

  function updateValue(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setFormError("");
    setErrors({});
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setErrors(result.error?.fields || {});
        throw new Error(result.error?.message || "Registration is temporarily unavailable. Please try again.");
      }
      router.replace(result.data?.redirectTo || "/dashboard");
      router.refresh();
    } catch (error) {
      setFormError(error.message || "Registration is temporarily unavailable. Please try again.");
      setLoading(false);
    }
  }

  const passwordLength = values.password.length;
  const strength = passwordLength === 0 ? 0 : passwordLength < 12 ? 1 : passwordLength < 16 ? 2 : 3;
  const strengthLabels = ["Add a password", "Needs more characters", "Good length", "Strong length"];
  const strengthColors = ["bg-line", "bg-warning", "bg-brand-muted", "bg-success"];

  return <main className="grid min-h-screen bg-canvas lg:grid-cols-2">
    <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
      <div className="w-full max-w-[480px]"><MarketingBrand className="mb-8" /><Card className="p-6 sm:p-9"><div className="mb-7"><p className="text-xs font-bold uppercase tracking-[.15em] text-brand">{trialPlanName ? `${trialPlanName} trial` : "Seven-day trial"}</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Create your gym account</h1><p className="mt-2 text-sm leading-6 text-ink-muted">Start your eligible seven-day trial. Paid access after the trial requires verified payment.</p></div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input id="register-full-name" name="fullName" label="Your full name" autoComplete="name" maxLength={120} value={values.fullName} onChange={(event) => updateValue("fullName", event.target.value)} error={errors.fullName} required />
          <Input id="register-gym-name" name="gymName" label="Gym name" hint="Existing gyms should sign in or contact support." autoComplete="organization" maxLength={120} value={values.gymName} onChange={(event) => updateValue("gymName", event.target.value)} error={errors.gymName} required />
          <Input id="register-email" name="email" label="Email address" type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" value={values.email} onChange={(event) => updateValue("email", event.target.value)} error={errors.email} required />
          <div><Input id="register-password" name="password" label="Password" type="password" autoComplete="new-password" minLength={12} hint="Use at least 12 characters." value={values.password} onChange={(event) => updateValue("password", event.target.value)} error={errors.password} required />
            <div className="mt-3" aria-live="polite"><div className="mb-2 flex items-center justify-between text-[11px]"><span className={passwordLength >= 12 ? "font-medium text-success" : "text-ink-muted"}>{passwordLength >= 12 ? <><Check className="mr-1 inline" size={13} aria-hidden="true" />12-character rule met</> : "12 characters minimum"}</span><span className="text-ink-subtle">{strengthLabels[strength]}</span></div><div className="grid grid-cols-3 gap-1.5" aria-label={`Password length indicator: ${strengthLabels[strength]}`}>{[1, 2, 3].map((level) => <span key={level} className={`h-1 rounded-pill ${strength >= level ? strengthColors[strength] : "bg-line"}`} />)}</div></div>
          </div>
          {formError && <p className="rounded-lg border border-error/20 bg-error-soft px-3 py-2.5 text-sm text-error" role="alert">{formError}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={loading} aria-busy={loading}>{loading ? <><span className="size-4 animate-spin rounded-full border-2 border-auth-spinner-track border-t-white" aria-hidden="true" />Creating account…</> : <><UserPlus size={16} aria-hidden="true" />Create owner account</>}</Button>
          <p className="text-center text-sm text-ink-muted">Already have an account? <Link className="font-medium text-brand hover:underline" href="/login">Sign in</Link></p>
        </form>
      </Card><p className="mt-6 text-center text-xs text-ink-muted">Fitivo · Gym management workspace</p></div>
    </section>
    <aside className="relative hidden min-h-screen flex-col justify-center overflow-hidden bg-ink p-8 text-white lg:flex xl:p-14"><div className="absolute -right-24 -top-24 size-96 rounded-full bg-brand/20 blur-2xl" aria-hidden="true" /><div className="relative mx-auto w-full max-w-xl"><MarketingBrand inverse className="mb-12" /><Building2 size={26} className="mb-5 text-indigo-300" aria-hidden="true" /><h2 className="max-w-lg text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">A better home for your gym.</h2><p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">Create an owner workspace to manage members, memberships, payments, and attendance.</p><div className="mt-8"><MarketingProductPreview compact /></div></div></aside>
  </main>;
}
