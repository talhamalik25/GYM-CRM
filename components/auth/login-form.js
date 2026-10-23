"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../ui/button";
import Card from "../ui/card";
import Input from "../ui/input";


function validate(values) {
  const errors = {};

  if (values.email.trim() === "") {
    errors.email = "Enter your email address.";
  } else if (!values.email.includes("@") || !values.email.includes(".")) {
    errors.email = "Enter a valid email address.";
  }

  if (values.password === "") {
    errors.password = "Enter your password.";
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

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
    <main className="auth-shell">
      <section className="auth-main">
        <div className="auth-main-inner">
          <div className="auth-brand" aria-label="Fitivo sign in">
            Fitivo<span aria-hidden="true" />
          </div>
          <Card className="auth-card">
            <div className="auth-card-header">
              <h1>Sign in</h1>
              <p>Welcome back. Sign in to manage your gym.</p>
            </div>
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="auth-field" aria-live="polite">
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
              <div className="auth-password-field" aria-live="polite">
                <Input
                  id="login-password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={values.password}
                  onChange={(event) => updateValue("password", event.target.value)}
                  error={errors.password}
                  className="auth-password-input"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                </button>
              </div>
              <div className="auth-forgot-row">
                <span aria-label="Forgot password?"><span>Forgot password?</span></span>
              </div>
              {formError && <p className="auth-form-error" role="alert">{formError}</p>}
              <Button type="submit" size="lg" className="auth-submit" loading={loading} loadingLabel="Signing in…">
                <LockKeyhole size={16} strokeWidth={1.75} aria-hidden="true" />Sign in
              </Button>
              <p className="auth-account-link">New to Fitivo? <Link href="/register">Create a gym account</Link></p>
            </form>
          </Card>
          <p className="auth-footer-note">Fitivo · Gym management workspace</p>
        </div>
      </section>

      <aside className="auth-story">
        <div className="auth-orbit auth-orbit-large" aria-hidden="true" />
        <div className="auth-orbit auth-orbit-small" aria-hidden="true" />
        <div className="auth-story-brand">Fitivo<span aria-hidden="true" /></div>
        <div className="auth-story-copy">
          <div className="auth-story-rule" aria-hidden="true" />
          <p className="auth-story-title">Your gym, in sync.</p>
          <p className="auth-story-description">Manage members, plans, payments and attendance in one place.</p>
        </div>
        <p className="auth-story-footer">Fitivo gym management</p>
      </aside>
    </main>
  );
}
