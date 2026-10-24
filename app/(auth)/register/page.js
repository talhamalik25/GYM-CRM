import RegisterForm from "../../../components/auth/register-form";
import { getPublicRegistrationAvailability } from "../../../lib/publicRegistrationAvailability.js";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const registration = await getPublicRegistrationAvailability();
  return <RegisterForm registrationAvailable={registration.enabled} trialPlanName={registration.planName} />;
}
