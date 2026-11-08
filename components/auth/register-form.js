"use client";

import { useRef, useState } from "react";
import { Building2, Check, Eye, EyeOff, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../ui/button";

import Input from "../ui/input";
import AuthLayout, { authFormClasses, authActionClasses, authLinkClasses, authErrorClasses } from "./auth-layout.js";

const initialValues = { fullName: "", email: "", password: "", gymName: "" };

function validate(values) {
  const errors = {};
  if (values.fullName.trim() === "") errors.fullName = "Enter your full name.";
  if (values.gymName.trim() === "") errors.gymName = "Enter your gym name.";
  if (values.email.trim() === "") errors.email = "Enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "Enter a valid email address.";
  if (values.password === "") errors.password = "Enter a password.";
  else if (values.password.length < 12) errors.password = "Password must be at least 12 characters.";
  return errors;
}

function RegistrationClosed() {
  return <AuthLayout titleId="registration-closed-title" eyebrow="Fitivo access" title="Your next chapter starts here." description="Registration is currently closed. If your gym already uses Fitivo, sign in to your workspace.">
    <div className="my-7 flex items-start gap-3 rounded-xl border border-line bg-canvas p-4">
      <Building2 size={20} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
      <p className="text-sm leading-6 text-ink-muted">For questions about getting started, contact the Fitivo team.</p>
    </div>
    <Button href="/login" size="lg" className={authActionClasses}>Sign in to Fitivo</Button>
    <p className="mt-5 text-center text-sm"><Link href="/contact" className={authLinkClasses}>Contact the team</Link></p>
  </AuthLayout>;
}

export default function RegisterForm({ registrationAvailable = false, trialPlanName = "" }) {
  const router = useRouter();
  const formRef = useRef(null);
  const submitting = useRef(false);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!registrationAvailable) return <RegistrationClosed />;

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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      let result;
      try { result = await response.json(); }
      catch { throw new Error("Registration is temporarily unavailable. Please try again."); }
      if (!response.ok || !result.success) {
        setErrors(result.error?.fields || {});
        throw new Error(result.error?.message || "Registration is temporarily unavailable. Please try again.");
      }
      router.replace(result.data?.redirectTo || "/dashboard");
      router.refresh();
    } catch (error) {
      setFormError(error instanceof TypeError ? "We couldn't connect. Check your connection and try again." : error.message || "Registration is temporarily unavailable. Please try again.");
      submitting.current = false;
      setLoading(false);
    }
  }

  const passwordLength = values.password.length;
  const strength = passwordLength === 0 ? 0 : passwordLength < 12 ? 1 : passwordLength < 16 ? 2 : 3;
  const strengthLabels = ["Add a password", "Needs more characters", "Good length", "Strong length"];
  const strengthColors = ["bg-line", "bg-warning", "bg-brand-muted", "bg-success"];

  return <AuthLayout compact titleId="register-title" eyebrow={trialPlanName ? `${trialPlanName} trial` : "Seven-day trial"} title="Make room for your gym to grow." description="Create your owner workspace. Start your eligible seven-day trial; paid access requires verified payment.">
        <form ref={formRef} className={authFormClasses} onSubmit={handleSubmit} noValidate aria-busy={loading}>
          <Input id="register-full-name" name="fullName" label="Your full name" autoComplete="name" maxLength={120} value={values.fullName} onChange={(event) => updateValue("fullName", event.target.value)} error={errors.fullName} readOnly={loading} required />
          <Input id="register-gym-name" name="gymName" label="Gym name" hint="Existing gyms should sign in or contact support." autoComplete="organization" maxLength={120} value={values.gymName} onChange={(event) => updateValue("gymName", event.target.value)} error={errors.gymName} readOnly={loading} required />
          <Input id="register-email" name="email" label="Email address" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} maxLength={254} placeholder="you@example.com" value={values.email} onChange={(event) => updateValue("email", event.target.value)} error={errors.email} readOnly={loading} required />
          <div className="relative [&_.ui-input]:pr-14!">
            <div><Input id="register-password" name="password" label="Password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={12} hint="Use at least 12 characters." placeholder="Create a strong password" value={values.password} onChange={(event) => updateValue("password", event.target.value)} error={errors.password} readOnly={loading} required />
            <button type="button" className="absolute right-1 top-[30px] grid size-11 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-canvas hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} aria-controls="register-password">{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
            </div>
            <div className="mt-3" aria-live="polite"><div className="mb-2 flex items-center justify-between text-xs"><span className={passwordLength >= 12 ? "font-medium text-success" : "text-ink-muted"}>{passwordLength >= 12 ? <><Check className="mr-1 inline" size={13} aria-hidden="true" />12-character rule met</> : "12 characters minimum"}</span><span className="text-ink-subtle">{strengthLabels[strength]}</span></div><div className="grid grid-cols-3 gap-1.5" aria-label={`Password length indicator: ${strengthLabels[strength]}`}>{[1, 2, 3].map((level) => <span key={level} className={`h-1 rounded-pill ${strength >= level ? strengthColors[strength] : "bg-line"}`} />)}</div></div>
          </div>
          {formError && <p className={authErrorClasses} role="alert">{formError}</p>}
          <Button type="submit" size="lg" className={authActionClasses} loading={loading} loadingLabel="Creating account…"><UserPlus size={16} aria-hidden="true" />Create owner account</Button>
          <span role="status" aria-live="polite" className="sr-only">{loading ? "Creating your gym account. Please wait." : ""}</span>
          <p className="text-center text-sm text-ink-muted">Already have an account? <Link className={authLinkClasses} href="/login">Sign in</Link></p>
        </form>
  </AuthLayout>;
}
