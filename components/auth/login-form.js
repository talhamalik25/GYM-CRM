"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../ui/button";
import Card from "../ui/card";
import Input from "../ui/input";
import { MarketingBrand } from "../marketing/marketing-primitives.js";
import MarketingProductPreview from "../marketing/marketing-product-preview.js";


function validate(values) {
  const errors = {};

  if (values.email.trim() === "") {
    errors.email = "Enter your email address.";
  } else if (!values.email.includes("@") || !values.email.includes(".")) {
    errors.email = "Enter a valid email address.";
  }

  if (values.password === "") {
    errors.password = "Enter your password.";
  }

  return errors;
}


export default function LoginForm({ registrationAvailable = false }) {
  const router = useRouter();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function updateValue(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Sign-in failed. Please try again.");
      router.replace(result.data?.redirectTo || "/dashboard");
      router.refresh();
    } catch (error) {
      setFormError(error.message || "Sign-in is temporarily unavailable. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-canvas lg:grid-cols-2">
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-[440px]">
          <MarketingBrand className="mb-10" />
          <Card className="p-6 sm:p-9">
            <div className="mb-7">
              <h1 className="text-2xl font-semibold tracking-tight text-ink">Welcome back.</h1>
              <p className="mt-2 text-sm leading-6 text-ink-muted">Sign in to manage your gym workspace.</p>
            </div>
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div aria-live="polite">
                <Input
                  id="login-email"
                  name="email"
                  label="Email address"
                  type="email"
                  autoComplete="username"
                  placeholder="you@example.com"
                  value={values.email}
                  onChange={(event) => updateValue("email", event.target.value)}
                  error={errors.email}
                  required
                />
              </div>
              <div className="relative" aria-live="polite">
                <Input
                  id="login-password"
                  name="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={values.password}
                  onChange={(event) => updateValue("password", event.target.value)}
                  error={errors.password}
                  className="pr-12"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-[38px] grid size-9 place-items-center rounded-lg text-ink-muted hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                </button>
              </div>
              {formError && <p className="rounded-lg border border-error/20 bg-error-soft px-3 py-2.5 text-sm text-error" role="alert">{formError}</p>}
              <Button type="submit" size="lg" className="w-full" loading={loading} loadingLabel="Signing in…">
                <LockKeyhole size={16} strokeWidth={1.75} aria-hidden="true" />Sign in
              </Button>
              {registrationAvailable && <p className="text-center text-sm text-ink-muted">New to Fitivo? <Link className="font-medium text-brand hover:underline" href="/register">Create a gym account</Link></p>}
            </form>
          </Card>
          <p className="mt-6 text-center text-xs text-ink-muted">Fitivo · Gym management workspace</p>
        </div>
      </section>

      <aside className="relative hidden min-h-screen flex-col justify-center overflow-hidden bg-ink p-8 text-white lg:flex xl:p-14">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-brand/20 blur-2xl" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-xl"><MarketingBrand inverse className="mb-12" /><h2 className="max-w-lg text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">Your gym, in sync.</h2><p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">Manage members, memberships, attendance, and payments in one connected workspace.</p><div className="mt-9"><MarketingProductPreview compact /></div></div>
      </aside>
    </main>
  );
}
