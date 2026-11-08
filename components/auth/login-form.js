"use client";

import { useRef, useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Button from "../ui/button";
import Input from "../ui/input";
import AuthLayout, { authFormClasses, authActionClasses, authLinkClasses, authErrorClasses } from "./auth-layout.js";

function validate(values) {
  const errors = {};
  if (values.email.trim() === "") errors.email = "Enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "Enter a valid email address.";
  if (values.password === "") errors.password = "Enter your password.";
  return errors;
}

export default function LoginForm({ registrationAvailable = false }) {
  const router = useRouter();
  const tAuth = useTranslations("auth");
  const formRef = useRef(null);
  const submitting = useRef(false);
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  function updateValue(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) {
      formRef.current?.elements.namedItem(Object.keys(nextErrors)[0])?.focus();
      return;
    }
    submitting.current = true;
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      let result;
      try { result = await response.json(); }
      catch { throw new Error("Sign-in is temporarily unavailable. Please try again."); }
      if (!response.ok || !result?.success) throw new Error(result?.error?.message || "Sign-in failed. Please try again.");
      setSignedIn(true);
      router.replace(result.data?.redirectTo || "/dashboard");
      router.refresh();
    } catch (error) {
      setFormError(error instanceof TypeError ? "We couldn’t connect. Check your connection and try again." : error.message || "Sign-in is temporarily unavailable. Please try again.");
      submitting.current = false;
      setLoading(false);
    }
  }

  return <AuthLayout
    titleId="login-title"
    eyebrow={tAuth("loginEyebrow", { default: "Welcome to your workspace" })}
    title={tAuth("loginTitle", { default: "Good to see you again." })}
    description={tAuth("loginDescription", { default: "Sign in to stay connected to your gym, your team and your members." })}
  >
    <form ref={formRef} className={authFormClasses} onSubmit={handleSubmit} noValidate aria-busy={loading}>
      <Input
        id="login-email"
        name="email"
        label={tAuth("email", { default: "Email address" })}
        type="email"
        autoComplete="username"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={254}
        placeholder="you@example.com"
        value={values.email}
        onChange={(event) => updateValue("email", event.target.value)}
        error={errors.email}
        readOnly={loading}
        required
      />
      <div className="relative [&_.ui-input]:pr-14! rtl:[&_.ui-input]:pr-4! rtl:[&_.ui-input]:pl-14!">
        <Input
          id="login-password"
          name="password"
          label={tAuth("password", { default: "Password" })}
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Enter your password"
          value={values.password}
          onChange={(event) => updateValue("password", event.target.value)}
          error={errors.password}
          readOnly={loading}
          required
        />
        <button
          type="button"
          className="absolute right-1 top-[30px] grid size-11 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-canvas hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none rtl:right-auto rtl:left-1"
          onClick={() => setShowPassword((visible) => !visible)}
          aria-label={showPassword ? tAuth("showPassword", { default: "Hide password" }) : tAuth("hidePassword", { default: "Show password" })}
          aria-pressed={showPassword}
          aria-controls="login-password"
        >
          {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
      {formError && <p className={authErrorClasses} role="alert">{formError}</p>}
      <Button
        type="submit"
        size="lg"
        className={authActionClasses}
        loading={loading}
        loadingLabel={signedIn ? "Opening your workspace…" : tAuth("signingIn", { default: "Signing in…" })}
      >
        {tAuth("signIn", { default: "Sign in to your workspace" })} <ArrowRight size={16} aria-hidden="true" className="rtl:rotate-180" />
      </Button>
      <span className={signedIn ? "text-sm text-success" : "sr-only"} role="status" aria-live="polite">
        {signedIn ? "Signed in. Opening your workspace…" : loading ? "Signing in. Please wait." : ""}
      </span>
    </form>
    {registrationAvailable && (
      <p className="mt-6 border-t border-line pt-6 text-sm leading-6 text-ink-muted">
        {tAuth("newToFitivo", { default: "New to Fitivo?" })}{" "}
        <Link href="/register" className={authLinkClasses}>
          {tAuth("startFreeTrial", { default: "Start your 7-day free trial" })}
        </Link>
      </p>
    )}
    <p className="mt-6 flex items-center gap-2 text-xs leading-5 text-ink-muted">
      <LockKeyhole size={14} className="shrink-0" aria-hidden="true" />
      Your workspace. Access for your team.
    </p>
  </AuthLayout>;
}
