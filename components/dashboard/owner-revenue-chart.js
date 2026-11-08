"use client";

import { Bar, BarChart, CartesianGrid, Rectangle, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import EmptyState from "../ui/empty-state";

const money = (value) => `PKR ${Number(value).toLocaleString("en-PK")}`;
const compact = (value) =>
  Intl.NumberFormat("en-PK", { notation: "compact", maximumFractionDigits: 1 }).format(value);

function RevenueBar({ x, y, width, height, payload }) {
  return (
    <Rectangle
      x={x}
      y={y}
      width={width}
      height={height}
      radius={[6, 6, 0, 0]}
      fill={payload.current ? "#4F46E5" : "color-mix(in srgb, var(--brand, #4F46E5) 24%, var(--canvas, #e2e8f0))"}
    />
  );
}

function RevenueTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const month = payload[0].payload;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-lg shadow-slate-900/10">
      <p className="font-medium text-ink-muted">{month.fullLabel}</p>
      <p className="mt-0.5 text-sm font-bold text-ink">{money(month.paymentCollected)}</p>
    </div>
  );
}

export default function OwnerRevenueChart({ months }) {
  const data = months.map((month, index) => {
    const date = new Date(`${month.month}-01T00:00:00Z`);
    return {
      ...month,
      label: date.toLocaleDateString("en-PK", { month: "short", timeZone: "UTC" }),
      fullLabel: date.toLocaleDateString("en-PK", { month: "long", year: "numeric", timeZone: "UTC" }),
      current: index === months.length - 1,
    };
  });

  if (!data.some(({ paymentCollected }) => paymentCollected > 0)) {
    return (
      <EmptyState
        title="No revenue recorded yet"
        description="Recorded member payments will appear here."
        className="py-8 border-0 bg-transparent shadow-none"
      />
    );
  }

  return (
    <div className="owner-revenue-plot h-64 sm:h-72 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 500, height: 260 }}>
        <BarChart data={data} accessibilityLayer margin={{ top: 16, right: 0, left: -10, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--divider, #e2e8f0)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--ink-subtle, #64748b)", fontSize: 12 }}
            tickMargin={12}
            interval={0}
            height={36}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--ink-subtle, #64748b)", fontSize: 12 }}
            tickFormatter={compact}
            width={52}
            tickCount={5}
          />
          <Tooltip content={<RevenueTooltip />} cursor={{ fill: "var(--brand-soft, #eef2ff)" }} />
          <Bar
            dataKey="paymentCollected"
            name="Revenue (PKR)"
            shape={RevenueBar}
            maxBarSize={44}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
