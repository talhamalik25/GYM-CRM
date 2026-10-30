import { requirePublicGymOperationalPage } from "../../../lib/ownerPageAccess.js";

export default async function WorkoutsPage() {
  await requirePublicGymOperationalPage();
  return (
    <div className="memberships-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">WORKOUTS</p>
          <h1>Workout Plans</h1>
          <p>Personalized plans to keep training focused and fun.</p>
        </div>
      </div>
      <div className={"ui-empty-state exact:grid exact:[justify-items:center] exact:[gap:8px] exact:[padding:48px_24px] exact:[border:1px_dashed_var(--line-strong)] exact:[border-radius:var(--radius-lg)] exact:[background:var(--surface)] exact:text-center exact:[color:var(--ink-muted)] exact:[&_h3]:[margin:0] exact:[&_h3]:[color:var(--ink)] exact:[&_h3]:[font-size:15px] exact:[&_h3]:[font-weight:700] exact:[&_p]:[max-width:420px] exact:[&_p]:[margin:0] exact:[&_p]:[color:var(--ink-muted)] exact:[&_p]:[font-size:13px] exact:[&_p]:[line-height:1.6]"}>
        <span className={"ui-empty-icon exact:[color:var(--ink-subtle)]"} style={{ fontSize: 28 }}>🏋️</span>
        <h3>Coming soon</h3>
        <p>Workout plan management is under development. You&apos;ll be able to create, assign, and track personalized workout plans for your members here.</p>
      </div>
    </div>
  );
}
