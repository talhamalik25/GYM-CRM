"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../ui/button";
import Input from "../ui/input";
import { MarketingBrand } from "../marketing/marketing-primitives.js";
import MarketingProductPreview from "../marketing/marketing-product-preview.js";
import styles from "../marketing/marketing.module.css";

function validate(values) {
  const errors = {};
  if (values.email.trim() === "") errors.email = "Enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "Enter a valid email address.";
  if (values.password === "") errors.password = "Enter your password.";
  return errors;
}

export default function LoginForm({ registrationAvailable = false }) {
  const router = useRouter();
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

  return <main className={styles.auth}>
    <aside className={styles.authStory} aria-label="Fitivo gym management">
      <MarketingBrand inverse />
      <div className={styles.authStoryContent}>
        <div className={styles.authEyebrow}><span /> BUILT FOR THE BUSINESS OF FITNESS</div>
        <h2>Great gyms are built<br />on great experiences.<br /><span>Start with yours.</span></h2>
        <p>Less admin between you and your next big step. Your members, team, and business, connected.</p>
        <div className={styles.authProduct}><MarketingProductPreview compact /></div>
      </div>
      <div className={styles.authStoryFooter}><ShieldCheck size={14} aria-hidden="true" />Your gym. Your people. One connected workspace.</div>
    </aside>
    <section className={styles.authFormSection} aria-labelledby="login-title">
      <div className={styles.authTop}><MarketingBrand /><Link href="/" className={styles.backLink}><ArrowLeft size={13} aria-hidden="true" />Back to home</Link></div>
      <div className={styles.authFormWrap}>
        <div className={styles.authFormIcon}><LockKeyhole size={22} strokeWidth={1.7} aria-hidden="true" /></div>
        <h1 id="login-title">Welcome back.</h1>
        <p className={styles.authIntro}>Enter your details to access your gym workspace.</p>
        <form ref={formRef} className={styles.loginForm} onSubmit={handleSubmit} noValidate aria-busy={loading}>
          <Input id="login-email" name="email" label="Email address" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false} maxLength={254} placeholder="you@example.com" value={values.email} onChange={(event) => updateValue("email", event.target.value)} error={errors.email} readOnly={loading} required />
          <div className={styles.passwordField}>
            <Input id="login-password" name="password" label="Password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={values.password} onChange={(event) => updateValue("password", event.target.value)} error={errors.password} readOnly={loading} required />
            <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} aria-controls="login-password">{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
          </div>
          {formError && <p className={styles.loginError} role="alert">{formError}</p>}
          <Button type="submit" size="lg" className={styles.loginSubmit} loading={loading} loadingLabel={signedIn ? "Opening your workspace…" : "Signing in…"}>Sign in to your workspace <ArrowRight size={16} aria-hidden="true" /></Button>
          <span className={signedIn ? styles.loginSuccess : "sr-only"} role="status" aria-live="polite">{signedIn ? "Signed in. Opening your workspace…" : loading ? "Signing in. Please wait." : ""}</span>
        </form>
        {registrationAvailable && <p className={styles.authRegister}>New to Fitivo? <Link href="/register">Start your 7-day free trial <span aria-hidden="true">↗</span></Link></p>}
        <p className={styles.authSecure}><LockKeyhole size={12} aria-hidden="true" />Your workspace. Access for your team.</p>
      </div>
      <footer className={styles.authFooter}><span>© {new Date().getFullYear()} Fitivo</span><div><Link href="/privacy">Privacy information</Link><Link href="/terms">Terms information</Link></div></footer>
    </section>
  </main>;
}
