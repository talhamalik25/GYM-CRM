"use client";

import { useState } from "react";
import { Building2, Check, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../ui/button";

import Input from "../ui/input";
import AuthLayout, { authFormClasses, authActionClasses, authLinkClasses, authErrorClasses } from "./auth-layout.js";

const initialValues = { fullName: "", email: "", password: "", gymName: "" };

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

  return <AuthLayout compact titleId="register-title" eyebrow={trialPlanName ? `${trialPlanName} trial` : "Seven-day trial"} title="Make room for your gym to grow." description="Create your owner workspace. Start your eligible seven-day trial; paid access requires verified payment.">
        <form className={authFormClasses} onSubmit={handleSubmit} aria-busy={loading}>
          <Input id="register-full-name" name="fullName" label="Your full name" autoComplete="name" maxLength={120} value={values.fullName} onChange={(event) => updateValue("fullName", event.target.value)} error={errors.fullName} required />
          <Input id="register-gym-name" name="gymName" label="Gym name" hint="Existing gyms should sign in or contact support." autoComplete="organization" maxLength={120} value={values.gymName} onChange={(event) => updateValue("gymName", event.target.value)} error={errors.gymName} required />
          <Input id="register-email" name="email" label="Email address" type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" value={values.email} onChange={(event) => updateValue("email", event.target.value)} error={errors.email} required />
          <div><Input id="register-password" name="password" label="Password" type="password" autoComplete="new-password" minLength={12} hint="Use at least 12 characters." value={values.password} onChange={(event) => updateValue("password", event.target.value)} error={errors.password} required />
            <div className="mt-3" aria-live="polite"><div className="mb-2 flex items-center justify-between text-xs"><span className={passwordLength >= 12 ? "font-medium text-success" : "text-ink-muted"}>{passwordLength >= 12 ? <><Check className="mr-1 inline" size={13} aria-hidden="true" />12-character rule met</> : "12 characters minimum"}</span><span className="text-ink-subtle">{strengthLabels[strength]}</span></div><div className="grid grid-cols-3 gap-1.5" aria-label={`Password length indicator: ${strengthLabels[strength]}`}>{[1, 2, 3].map((level) => <span key={level} className={`h-1 rounded-pill ${strength >= level ? strengthColors[strength] : "bg-line"}`} />)}</div></div>
          </div>
          {formError && <p className={authErrorClasses} role="alert">{formError}</p>}
          <Button type="submit" size="lg" className={authActionClasses} loading={loading} loadingLabel="Creating account…"><UserPlus size={16} aria-hidden="true" />Create owner account</Button>
          <span role="status" aria-live="polite" className="sr-only">{loading ? "Creating your gym account. Please wait." : ""}</span>
          <p className="text-center text-sm text-ink-muted">Already have an account? <Link className={authLinkClasses} href="/login">Sign in</Link></p>
        </form>
  </AuthLayout>;
}

