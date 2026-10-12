"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "../ui/button";
import Card from "../ui/card";
import Input from "../ui/input";
import { signIn } from "../../lib/authService";

function validate(values) {
  const errors = {};
  const email = values.email.trim();
  if (!email) errors.email = "Enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  if (!values.password) errors.password = "Enter your password.";
  else if (values.password.length < 6) errors.password = "Password must be at least 6 characters.";
  return errors;
}

export default function LoginForm() {
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
    await new Promise((resolve) => window.setTimeout(resolve, 250));
    const result = signIn(values.email, values.password);
    if (!result.success) {
      setFormError(result.message);
      setLoading(false);
      return;
    }
    router.replace("/dashboard");
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-canvas lg:grid-cols-[1.08fr_.92fr]">
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-[440px]">
          <div className="mb-10 inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-ink" aria-label="Fitivo sign in">
            Fitivo<span className="size-2 rounded-full bg-brand" aria-hidden="true" />
          </div>
          <Card className="p-6 sm:p-9">
            <div className="mb-7">
              <h1 className="text-2xl font-semibold tracking-tight text-ink">Sign in</h1>
              <p className="mt-2 text-sm leading-6 text-ink-muted">Welcome back. Sign in to manage your gym.</p>
            </div>
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div aria-live="polite">
                <Input
                  id="login-email"
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
                  className="absolute right-3 top-[31px] grid size-9 place-items-center rounded-md text-ink-muted hover:bg-canvas hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                </button>
              </div>
              <div className="flex justify-end">
                <span className="cursor-not-allowed text-xs text-ink-muted" title="Coming soon" aria-label="Forgot password? Coming soon">Forgot password? <span className="underline underline-offset-2">Coming soon</span></span>
              </div>
              {formError && <p className="rounded-lg border border-error/20 bg-error-soft px-3 py-2.5 text-sm text-error" role="alert">{formError}</p>}
              <Button type="submit" size="lg" className="w-full" disabled={loading} aria-busy={loading}>
                {loading ? <><span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />Signing in…</> : <><LockKeyhole size={16} aria-hidden="true" />Sign in</>}
              </Button>
              <p className="text-center text-xs text-ink-muted">Demo sign-in is temporary while Fitivo authentication is being built.</p>
            </form>
          </Card>
          <p className="mt-6 text-center text-xs text-ink-muted">Fitivo · Gym management workspace</p>
        </div>
      </section>

      <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-ink p-12 text-white lg:flex xl:p-16">
        <div className="absolute -right-24 -top-24 size-96 rounded-full border border-white/10" aria-hidden="true" />
        <div className="absolute -right-10 -top-10 size-64 rounded-full border border-white/10" aria-hidden="true" />
        <div className="relative flex items-center gap-3 text-lg font-semibold tracking-tight">Fitivo<span className="size-2 rounded-full bg-brand" aria-hidden="true" /></div>
        <div className="relative max-w-lg pb-8">
          <div className="mb-6 h-1 w-12 rounded-full bg-brand" aria-hidden="true" />
          <p className="text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">Your gym, in sync.</p>
          <p className="mt-4 max-w-md text-base leading-7 text-white/65">Manage members, plans, payments and attendance in one place.</p>
        </div>
        <p className="relative text-xs text-white/45">Fitivo gym management</p>
      </aside>
    </main>
  );
}
