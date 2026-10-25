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
      <div className="ui-empty-state">
        <span className="ui-empty-icon" style={{ fontSize: 28 }}>🏋️</span>
        <h3>Coming soon</h3>
        <p>Workout plan management is under development. You&apos;ll be able to create, assign, and track personalized workout plans for your members here.</p>
      </div>
    </div>
  );
}
