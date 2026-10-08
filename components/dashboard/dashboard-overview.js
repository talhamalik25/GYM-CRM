import PageHeader from "../ui/page-header";
import Button from "../ui/button";
import { DashboardStatCard, ExpiringMemberships, RecentPayments, TodaysAttendance } from "./dashboard-widgets";

export default function DashboardOverview({ data }) {
  const stats = data?.stats ?? [];
  return (
    <div className="space-y-7">
      <PageHeader
        title="Dashboard"
        description="Your daily overview of members, payments and attendance."
        actions={<Button href="/members/new">Add Member</Button>}
      />
      <section aria-label="Gym statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => <DashboardStatCard key={stat.key} stat={stat} />)}
      </section>
      <section aria-label="Memberships and payments" className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,1fr)]">
        <ExpiringMemberships memberships={data?.expiringMemberships ?? []} />
        <RecentPayments payments={data?.recentPayments ?? []} />
      </section>
      <TodaysAttendance attendance={data?.todaysAttendance ?? []} />
    </div>
  );
}
