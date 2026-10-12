import DashboardShell from "../../components/layout/dashboard-shell";
import RouteGuard from "../../components/auth/route-guard";

export default function DashboardLayout({ children }) {
  return <RouteGuard><DashboardShell>{children}</DashboardShell></RouteGuard>;
}
