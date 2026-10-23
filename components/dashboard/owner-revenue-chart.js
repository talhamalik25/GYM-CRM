"use client";

import { Bar, BarChart, CartesianGrid, Rectangle, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import EmptyState from "../ui/empty-state";

const money = (value) => `PKR ${Number(value).toLocaleString("en-PK")}`;
const compact = (value) => Intl.NumberFormat("en-PK", { notation: "compact", maximumFractionDigits: 1 }).format(value);

function RevenueBar({ x, y, width, height, payload }) {
  return <Rectangle x={x} y={y} width={width} height={height} radius={[4, 4, 0, 0]} fill={payload.current ? "var(--brand)" : "var(--chart-soft)"} />;
}

function RevenueTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const month = payload[0].payload;
  return <div className="owner-chart-tooltip"><p>{month.fullLabel}</p><strong>{money(month.paymentCollected)}</strong></div>;
}

export default function OwnerRevenueChart({ months }) {
  const data = months.map((month, index) => {
    const date = new Date(`${month.month}-01T00:00:00Z`);
    return {
      ...month,
      label: date.toLocaleDateString("en-PK", { month: "short", timeZone: "UTC" }),
      fullLabel: date.toLocaleDateString("en-PK", { month: "long", year: "numeric", timeZone: "UTC" }),
      // The report already supplies six ordered months ending in the gym's current month.
      current: index === months.length - 1,
    };
  });

  if (!data.some(({ paymentCollected }) => paymentCollected > 0)) return <EmptyState title="No revenue recorded yet" description="Recorded member payments will appear here." />;

  return <div className="owner-revenue-plot">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 500, height: 240 }}>
        <BarChart data={data} accessibilityLayer margin={{ top: 16, right: 0, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--divider)" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--ink-subtle)", fontSize: 12 }} tickMargin={12} interval={0} height={36} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--ink-subtle)", fontSize: 12 }} tickFormatter={compact} width={52} tickCount={5} />
          <Tooltip content={<RevenueTooltip />} cursor={{ fill: "var(--brand-soft)" }} />
          <Bar dataKey="paymentCollected" name="Revenue (PKR)" shape={RevenueBar} maxBarSize={40} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
  </div>;
}
