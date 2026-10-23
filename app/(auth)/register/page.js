import Link from "next/link";
import Card from "../../../components/ui/card";

export default function RegisterPage() {
  return <main className="auth-shell">
    <section className="auth-main">
      <div className="auth-main-inner">
        <div className="auth-brand" aria-label="Fitivo gym registration">Fitivo<span aria-hidden="true" /></div>
        <Card className="auth-card auth-paused-card">
          <span className="auth-notice-badge">Registration paused</span>
          <h1>Gym registration is paused</h1>
          <p>New public gym accounts are unavailable while existing data migration and tenant isolation are being verified.</p>
          <p className="auth-account-link">Already have an account? <Link href="/login">Sign in</Link></p>
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
        <p className="auth-story-title">A clearer view of your gym.</p>
        <p className="auth-story-description">Member records, memberships, payments and attendance come together in one workspace.</p>
      </div>
      <p className="auth-story-footer">Fitivo gym management</p>
    </aside>
  </main>;
}
