"use client";

import { useState } from "react";
import { Building2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../ui/button";
import Card from "../ui/card";
import Input from "../ui/input";

const initialValues = { fullName: "", email: "", password: "", gymName: "" };

export default function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <main className="grid min-h-screen grid-cols-1 bg-canvas lg:grid-cols-[1.08fr_.92fr]">
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-[440px]">
          <div className="mb-10 inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-ink" aria-label="Fitivo gym registration">
            Fitivo<span className="size-2 rounded-full bg-brand" aria-hidden="true" />
          </div>
          <Card className="p-6 sm:p-9">
            <div className="mb-7">
              <h1 className="text-2xl font-semibold tracking-tight text-ink">Create your gym account</h1>
              <p className="mt-2 text-sm leading-6 text-ink-muted">Start your free 7-day trial. After 7 days, a verified paid subscription is required to keep using your gym workspace. Your data stays saved.</p>
            </div>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <Input
                id="register-full-name"
                name="fullName"
                label="Your full name"
                autoComplete="name"
                maxLength={120}
                value={values.fullName}
                onChange={(event) => updateValue("fullName", event.target.value)}
                error={errors.fullName}
                required
              />
              <Input
                id="register-gym-name"
                name="gymName"
                label="Gym name"
                hint="One public trial per account email and gym URL name. Existing gyms should sign in or contact support."
                autoComplete="organization"
                maxLength={120}
                value={values.gymName}
                onChange={(event) => updateValue("gymName", event.target.value)}
                error={errors.gymName}
                required
              />
              <Input
                id="register-email"
                name="email"
                label="Email address"
                type="email"
                autoComplete="email"
                maxLength={254}
                placeholder="you@example.com"
                value={values.email}
                onChange={(event) => updateValue("email", event.target.value)}
                error={errors.email}
                required
              />
              <Input
                id="register-password"
                name="password"
                label="Password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                hint="Use at least 12 characters."
                value={values.password}
                onChange={(event) => updateValue("password", event.target.value)}
                error={errors.password}
                required
              />
              {formError && <p className="rounded-lg border border-error/20 bg-error-soft px-3 py-2.5 text-sm text-error" role="alert">{formError}</p>}
              <Button type="submit" size="lg" className="w-full" disabled={loading} aria-busy={loading}>
                {loading ? <><span className="size-4 animate-spin rounded-full border-2 border-auth-spinner-track border-t-white" aria-hidden="true" />Creating account…</> : <><UserPlus size={16} aria-hidden="true" />Create owner account</>}
              </Button>
              <p className="text-center text-sm text-ink-muted">Already have an account? <Link className="font-medium text-brand hover:underline" href="/login">Sign in</Link></p>
            </form>
          </Card>
          <p className="mt-6 text-center text-xs text-ink-muted">Fitivo · Gym management workspace</p>
        </div>
      </section>

      <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-ink p-12 text-white lg:flex xl:p-16">
        <div className="auth-orbit absolute -right-24 -top-24 size-96 rounded-full" aria-hidden="true" />
        <div className="auth-orbit absolute -right-10 -top-10 size-64 rounded-full" aria-hidden="true" />
        <div className="relative flex items-center gap-3 text-lg font-semibold tracking-tight">Fitivo<span className="size-2 rounded-full bg-brand" aria-hidden="true" /></div>
        <div className="relative max-w-lg pb-8">
          <div className="mb-6 h-1 w-12 rounded-full bg-brand" aria-hidden="true" />
          <Building2 size={28} className="mb-5 text-brand" aria-hidden="true" />
          <p className="text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">A better home for your gym.</p>
          <p className="auth-story-description">Create your owner workspace to manage members, plans, payments and attendance.</p>
        </div>
        <p className="auth-story-footer">Fitivo gym management</p>
      </aside>
    </main>
  );
}
