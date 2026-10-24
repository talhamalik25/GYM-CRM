import LoginForm from "../../../components/auth/login-form";
import { getPublicRegistrationAvailability } from "../../../lib/publicRegistrationAvailability.js";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const registration = await getPublicRegistrationAvailability();
  return <LoginForm registrationAvailable={registration.enabled} />;
}
