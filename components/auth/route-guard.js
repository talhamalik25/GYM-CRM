import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth";

export default async function RouteGuard({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return children;
}
