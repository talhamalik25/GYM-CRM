import Link from "next/link";
import Card from "../../../components/ui/card";

export default function RegisterPage() {
  return <main className="grid min-h-screen place-items-center bg-canvas px-5 py-10">
    <Card className="w-full max-w-md space-y-4 p-6 sm:p-9">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Gym registration is paused</h1>
      <p className="text-sm leading-6 text-ink-muted">New public gym accounts are unavailable while existing data migration and tenant isolation are being verified.</p>
      <p className="text-sm text-ink-muted">Already have an account? <Link className="font-medium text-brand hover:underline" href="/login">Sign in</Link></p>
    </Card>
  </main>;
}
