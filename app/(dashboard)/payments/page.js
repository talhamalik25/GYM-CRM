import { requirePublicGymOperationalPage } from "../../../lib/ownerPageAccess.js";
import PaymentsManager from "../../../components/payments/payments-manager";

export default async function PaymentsPage() {
  await requirePublicGymOperationalPage();
  return <PaymentsManager />;
}
