import { requirePublicGymOperationalPage } from "../../../lib/ownerPageAccess.js";
import GymSettings from "../../../components/settings/gym-settings";

export default async function SettingsPage() {
  await requirePublicGymOperationalPage();
  return <GymSettings />;
}
