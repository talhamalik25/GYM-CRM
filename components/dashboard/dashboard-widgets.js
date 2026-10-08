import Link from "next/link";
import { CalendarClock, ClipboardCheck, Clock3, CreditCard, UsersRound, WalletCards } from "lucide-react";
import Badge from "../ui/badge";
import Button from "../ui/button";
import Card from "../ui/card";
import EmptyState from "../ui/empty-state";
import Table from "../ui/table";

const statIcons = {
  activeMembers: UsersRound,
  expiringMemberships: CalendarClock,
  collectedMonth: WalletCards,
  todayCheckIns: ClipboardCheck,
};

function formatPKR(amount) {
  return "PKR " + Number(amount).toLocaleString("en-PK", { maximumFractionDigits: 0 });
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date + "T12:00:00Z"));
}

export function DashboardStatCard({ stat }) {
  const Icon = statIcons[stat.key] || CreditCard;
  const value = stat.format === "currency" ? formatPKR(stat.value) : Number(stat.value).toLocaleString("en-PK");
  const highlight = stat.key === "expiringMemberships";
  return (
    <Card as="article" className="flex min-h-36 flex-col justify-between p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-ink-muted">{stat.label}</h2>
        <span className={"grid size-10 place-items-center rounded-lg " + (highlight ? "bg-brand-soft text-brand" : "bg-surface-canvas text-ink-muted")}>
          <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
        </span>
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight text-ink">{value}</p>
        <p className="mt-1 text-xs text-ink-subtle">{stat.supportingText}</p>
      </div>
    </Card>
  );
}

function SectionTitle({ title, description, count }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {count !== undefined && <span className="rounded-full bg-surface-canvas px-2.5 py-1 text-xs font-medium text-ink-muted">{count}</span>}
    </div>
  );
}

function ListEmptyState({ icon, title, description, href, actionLabel }) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={<Button href={href} variant="secondary" size="sm">{actionLabel}</Button>}
    />
  );
}

function daysTone(daysLeft) {
  if (daysLeft <= 3) return "brand";
  if (daysLeft <= 7) return "warning";
  return "neutral";
}

export function ExpiringMemberships({ memberships }) {
  const columns = [
    { key: "memberName", label: "Member" },
    { key: "plan", label: "Plan" },
    { key: "expiryDate", label: "Expiry date", render: (row) => formatDate(row.expiryDate) },
    { key: "daysLeft", label: "Days left", render: (row) => <Badge tone={daysTone(row.daysLeft)}>{row.daysLeft === 0 ? "Today" : row.daysLeft + " days"}</Badge> },
    { key: "view", label: "", render: (row) => <Link className="font-semibold text-ink underline-offset-4 hover:text-brand hover:underline" href={"/members/" + row.memberId}>View</Link> },
  ];

  return (
    <Card className="min-w-0 p-5 md:p-6">
      <SectionTitle title="Expiring Memberships" description="Plans ending within the next seven days." count={memberships.length} />
      {memberships.length ? (
        <Table columns={columns} rows={memberships} getRowKey={(row) => row.memberId} className="min-w-[620px]" />
      ) : (
        <ListEmptyState
          icon={<CalendarClock size={23} strokeWidth={1.7} />}
          title="No memberships expiring soon"
          description="There are no memberships ending in the next seven days."
          href="/memberships"
          actionLabel="View plans"
        />
      )}
    </Card>
  );
}

function paymentTone(status) {
  const normalized = status.toLowerCase();
  if (normalized === "paid" || normalized === "complete" || normalized === "completed") return "success";
  if (normalized === "pending" || normalized === "processing") return "warning";
  return "error";
}

export function RecentPayments({ payments }) {
  return (
    <Card className="min-w-0 p-5 md:p-6">
      <SectionTitle title="Recent Payments" description="Latest member transactions." count={payments.length} />
      {payments.length ? (
        <ul className="divide-y divide-line" aria-label="Recent payments">
          {payments.map((payment) => (
            <li key={payment.id} className="flex items-center justify-between gap-3 py-4 first:pt-1 last:pb-1">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{payment.memberName}</p>
                <p className="mt-1 text-xs text-ink-muted">{formatDate(payment.date)}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="text-sm font-semibold tabular-nums text-ink">{formatPKR(payment.amount)}</span>
                <Badge tone={paymentTone(payment.status)}>{payment.status}</Badge>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ListEmptyState
          icon={<CreditCard size={23} strokeWidth={1.7} />}
          title="No recent payments"
          description="Payments will appear here when they are recorded."
          href="/payments"
          actionLabel="View payments"
        />
      )}
    </Card>
  );
}

export function TodaysAttendance({ attendance }) {
  const columns = [
    { key: "memberName", label: "Member" },
    { key: "checkInTime", label: "Check-in time", render: (row) => <span className="inline-flex items-center gap-2 text-ink-muted"><Clock3 size={15} aria-hidden="true" />{row.checkInTime}</span> },
  ];

  return (
    <Card className="p-5 md:p-6">
      <SectionTitle title="Today's Attendance" description="Members checked in today." count={attendance.length} />
      {attendance.length ? (
        <Table columns={columns} rows={attendance} getRowKey={(row) => row.id} className="min-w-[360px]" />
      ) : (
        <ListEmptyState
          icon={<ClipboardCheck size={23} strokeWidth={1.7} />}
          title="No check-ins today"
          description="Today's check-ins will appear here as members arrive."
          href="/attendance"
          actionLabel="View attendance"
        />
      )}
    </Card>
  );
}
