"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartEmptyState,
  ChartPanel,
  ChartSkeleton,
} from "@/components/sikampung/dashboard/chart-utils";
import type { BumKabupatenDatum } from "./bum-chart-types";

type KabupatenTooltipPayload = {
  payload?: BumKabupatenDatum;
};

export function BumKabupatenChart({
  year,
  data,
  loading,
}: {
  year: string;
  data: BumKabupatenDatum[];
  loading?: boolean;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const domainMax = Math.max(1, ...data.map((item) => item.value));

  return (
    <ChartPanel
      title="Sebaran BUMKam per Kab/Kota"
      ariaLabel={`Grafik sebaran BUM Kampung per kabupaten/kota tahun ${year}`}
    >
      {loading ? (
        <ChartSkeleton />
      ) : total === 0 ? (
        <ChartEmptyState>Belum ada data sebaran untuk TA {year}</ChartEmptyState>
      ) : (
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 12, right: 40, bottom: 8, left: 8 }}
            >
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis
                type="number"
                allowDecimals={false}
                domain={[0, Math.ceil(domainMax * 1.12)]}
                tick={{ fontSize: 11, fill: "#64748b" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={104}
                tick={{ fontSize: 12, fill: "#334155" }}
              />
              <Tooltip content={<KabupatenTooltip />} />
              <Bar dataKey="value" fill="#2563eb" radius={[0, 6, 6, 0]}>
                <LabelList
                  dataKey="value"
                  position="right"
                  className="fill-pbd-navy text-xs font-bold"
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartPanel>
  );
}

function KabupatenTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: KabupatenTooltipPayload[];
}) {
  if (!active || !payload?.length || !payload[0]?.payload) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
      <p className="font-bold text-pbd-navy">{item.name}</p>
      <p className="mt-1 text-slate-600">{item.value} BUMKam</p>
    </div>
  );
}
