"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../ui/button";
import Input from "../ui/input";
import { MarketingBrand } from "../marketing/marketing-primitives.js";
import MarketingCapabilityPanel from "../marketing/marketing-capability-panel.js";


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

  return <main className={"m-marketing-auth exact:[--m-ink:#161b2e] exact:[--m-muted:#646979] exact:[--m-line:#e7e8ef] exact:[--m-tint:#f7f8fc] exact:[--m-navy:#13182d] exact:[--m-accent:var(--brand,_#4f46e5)] exact:[--m-radius:20px] exact:[--m-section:clamp(72px,_7.5vw,_112px)] exact:[--m-shadow:0_24px_70px_-25px_rgb(32_35_80_/_22%),_0_3px_12px_rgb(32_35_80_/_4%)] exact:[color:var(--m-ink)] exact:[background:white] exact:[font-family:var(--font-app)] exact:[font-size:15px] exact:[line-height:1.65] exact:grid exact:[grid-template-columns:1.05fr_1fr] exact:[min-height:100svh] exact:at-most-899:[grid-template-columns:1fr] exact:less-motion:[&_*]:[animation:none]! exact:less-motion:[&_*]:[transition:none]! exact:less-motion:[&_*]:[scroll-behavior:auto]!"}>
    <aside className={"m-marketing-authStory exact:flex exact:flex-col exact:[min-width:0] exact:[padding:42px_48px_30px] exact:[color:white] exact:[background:radial-gradient(ellipse_at_80%_65%,_#302a60_0%,_#171c34_55%,_#13182d_100%)] exact:overflow-hidden exact:[&_h2]:[max-width:530px] exact:[&_h2]:[font-size:clamp(33px,_3.6vw,_51px)] exact:[&_h2]:[letter-spacing:-.05em] exact:[&_h2]:[font-weight:500] exact:[&_h2]:[line-height:1.15] exact:[&_h2_span]:[color:#b0a7f6] exact:at-least-1500:[padding-inline:max(60px,_calc((100vw_-_1400px)_/_3))] exact:at-most-1100:[padding-inline:30px] exact:at-most-899:hidden"} aria-label="Fitivo gym management">
      <MarketingBrand inverse />
      <div className={"m-marketing-authStoryContent exact:[margin-block:auto] exact:[padding-top:55px] exact:[padding-bottom:40px] exact:[&>p]:[max-width:390px] exact:[&>p]:[margin-top:19px] exact:[&>p]:[color:#a7adc4] exact:[&>p]:[font-size:13px] exact:[&>p]:[line-height:1.85]"}>
        <div className={"m-marketing-authEyebrow exact:flex exact:items-center exact:[gap:8px] exact:[margin-bottom:20px] exact:[color:#b5afd9] exact:[font-size:9px] exact:[font-weight:500] exact:[letter-spacing:.12em] exact:[&>span]:[width:5px] exact:[&>span]:[height:5px] exact:[&>span]:[border-radius:50%] exact:[&>span]:[background:#a197ef]"}><span /> BUILT FOR THE BUSINESS OF FITNESS</div>
        <h2>Great gyms are built<br />on great experiences.<br /><span>Start with yours.</span></h2>
        <p>Less admin between you and your next big step. Your members, team, and business, connected.</p>
        <div className="mt-9 max-w-[650px]"><MarketingCapabilityPanel title="Connected gym records" description="Keep member profiles, memberships, attendance and payment records together in your workspace." areas={["Members", "Attendance", "Payments"]} /></div>
      </div>
      <div className={"m-marketing-authStoryFooter exact:flex exact:items-center exact:[gap:8px] exact:[color:#9ca4be] exact:[font-size:10px]"}><ShieldCheck size={14} aria-hidden="true" />Your gym. Your people. One connected workspace.</div>
    </aside>
    <section className={"m-marketing-authFormSection exact:flex exact:flex-col exact:[padding:38px_48px_24px] exact:at-most-1100:[padding-inline:35px] exact:at-most-899:[min-height:100svh] exact:at-most-899:[padding:28px_32px_22px] exact:at-most-639:[padding:24px_24px_20px] exact:at-most-359:[padding-inline:20px]"} aria-labelledby="login-title">
      <div className={"m-marketing-authTop exact:flex exact:items-center exact:[justify-content:flex-end] exact:[font-size:11px] exact:[color:var(--m-muted)] exact:[&>.m-marketing-brand]:hidden exact:at-most-899:[justify-content:space-between] exact:at-most-899:[&>.m-marketing-brand]:inline-flex exact:at-most-639:[&_.m-marketing-backLink]:[font-size:10px]"}><MarketingBrand /><Link href="/" className={"m-marketing-backLink exact:inline-flex exact:items-center exact:[gap:6px] exact:[&:hover]:[color:var(--brand)]"}><ArrowLeft size={13} aria-hidden="true" />Back to home</Link></div>
      <div className={"m-marketing-authFormWrap exact:[width:100%] exact:[max-width:370px] exact:[margin:auto] exact:[padding-block:72px] exact:[&_h1]:[font-size:33px] exact:[&_h1]:[font-weight:600] exact:[&_h1]:[letter-spacing:-.05em] exact:[&_h1]:[line-height:1.2] exact:at-most-899:[max-width:400px] exact:at-most-639:[padding-block:58px] exact:at-most-639:[&_h1]:[font-size:32px]"}>
        <div className={"m-marketing-authFormIcon exact:grid exact:[place-items:center] exact:[width:46px] exact:[height:46px] exact:[border:1px_solid_#e4e1f6] exact:[border-radius:14px] exact:[background:#f6f5ff] exact:[color:var(--brand)] exact:[margin-bottom:25px]"}><LockKeyhole size={22} strokeWidth={1.7} aria-hidden="true" /></div>
        <h1 id="login-title">Welcome back.</h1>
        <p className={"m-marketing-authIntro exact:[color:var(--m-muted)] exact:[font-size:13px] exact:[margin-top:11px]"}>Enter your details to access your gym workspace.</p>
        <form ref={formRef} className={"m-marketing-loginForm exact:grid exact:[gap:22px] exact:[margin-top:33px] exact:[&_.ui-field]:[gap:9px] exact:[&_.ui-label]:[font-size:12px] exact:[&_.ui-label]:[font-weight:500] exact:[&_.ui-label]:[color:#363c50] exact:[&_.ui-input]:[min-height:50px] exact:[&_.ui-input]:[border-color:#dedfe8] exact:[&_.ui-input]:[border-radius:10px] exact:[&_.ui-input]:[background:white] exact:[&_.ui-input]:[padding-inline:14px] exact:[&_.ui-input]:[font-size:14px] exact:[&_.ui-input]:[box-shadow:0_2px_2px_#161b2e02] exact:[&_.ui-input:hover]:[border-color:#b7b3cf] exact:[&_.ui-input:focus]:[border-color:var(--brand)] exact:[&_.ui-input:focus]:[box-shadow:0_0_0_3px_#4f46e514] exact:[&_.ui-input::placeholder]:[color:#9397a5] exact:at-most-639:[&_.ui-input]:[font-size:16px]"} onSubmit={handleSubmit} noValidate aria-busy={loading}>
          <Input id="login-email" name="email" label="Email address" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false} maxLength={254} placeholder="you@example.com" value={values.email} onChange={(event) => updateValue("email", event.target.value)} error={errors.email} readOnly={loading} required />
          <div className={"m-marketing-passwordField exact:relative exact:[&_.ui-input]:[padding-right:52px]"}>
            <Input id="login-password" name="password" label="Password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={values.password} onChange={(event) => updateValue("password", event.target.value)} error={errors.password} readOnly={loading} required />
            <button type="button" className={"m-marketing-passwordToggle exact:absolute exact:[right:5px] exact:[top:31px] exact:grid exact:[place-items:center] exact:[width:41px] exact:[height:40px] exact:[border:0] exact:[border-radius:7px] exact:[background:transparent] exact:[color:#818598] exact:[&:hover]:[color:var(--brand)] exact:[&:hover]:[background:#f5f4fc]"} onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} aria-controls="login-password">{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
          </div>
          {formError && <p className={"m-marketing-loginError exact:[padding:12px_14px] exact:[border:1px_solid_#f1c9c9] exact:[border-radius:9px] exact:[background:#fff6f6] exact:[color:#991b1b] exact:[font-size:12px]"} role="alert">{formError}</p>}
          <Button type="submit" size="lg" className={"m-marketing-loginSubmit exact:[min-height:50px] exact:[border-radius:10px] exact:[margin-top:3px] exact:[background:var(--brand)] exact:[color:white] exact:![box-shadow:0_4px_8px_#4f46e514] exact:![font-size:13px] exact:![line-height:13px]"} loading={loading} loadingLabel={signedIn ? "Opening your workspace…" : "Signing in…"}>Sign in to your workspace <ArrowRight size={16} aria-hidden="true" /></Button>
          <span className={signedIn ? "m-marketing-loginSuccess exact:[color:var(--success)] exact:[font-size:12px]" : "sr-only"} role="status" aria-live="polite">{signedIn ? "Signed in. Opening your workspace…" : loading ? "Signing in. Please wait." : ""}</span>
        </form>
        {registrationAvailable && <p className={"m-marketing-authRegister exact:[margin-top:26px] exact:[padding-top:24px] exact:[border-top:1px_solid_var(--m-line)] exact:[color:var(--m-muted)] exact:[font-size:12px] exact:text-center exact:[&_a]:[color:var(--brand)] exact:[&_a]:[font-weight:600] exact:[&_a:hover]:[text-decoration:underline]"}>New to Fitivo? <Link href="/register">Start your 7-day free trial <span aria-hidden="true">↗</span></Link></p>}
        <p className={"m-marketing-authSecure exact:flex exact:items-center exact:justify-center exact:[gap:6px] exact:[margin-top:24px] exact:[color:#858999] exact:[font-size:10px]"}><LockKeyhole size={12} aria-hidden="true" />Your workspace. Access for your team.</p>
      </div>
      <footer className={"m-marketing-authFooter exact:flex exact:[justify-content:space-between] exact:flex-wrap exact:[gap:12px] exact:[color:#898d9c] exact:[font-size:9px] exact:[&>div]:flex exact:[&>div]:[gap:16px] exact:[&_a:hover]:[color:var(--brand)] exact:at-most-639:[font-size:8px] exact:at-most-639:[gap:10px] exact:at-most-639:[&>div]:[gap:12px]"}><span>© {new Date().getFullYear()} Fitivo</span><div><Link href="/privacy">Privacy information</Link><Link href="/terms">Terms information</Link></div></footer>
    </section>
  </main>;
}
