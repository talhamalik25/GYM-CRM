import LoginForm from "../../../components/auth/login-form";
import { getPublicRegistrationAvailability } from "../../../lib/publicRegistrationAvailability.js";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Log in | Fitivo",
  description: "Sign in to your Fitivo workspace to manage your gym’s members, memberships, attendance, and payments.",
  robots: { index: false, follow: true },
};

export default async function LoginPage() {
  const registration = await getPublicRegistrationAvailability();
  return <LoginForm registrationAvailable={registration.enabled} />;
}
