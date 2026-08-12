"use client";

import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartEmptyState,
  ChartPanel,
  ChartSkeleton,
  formatIdm,
  formatIdmLabel,
  getNumberDomain,
} from "@/components/sikampung/dashboard/chart-utils";
import type { IDMTrendDatum } from "./idm-chart-types";

type TrendTooltipPayload = {
  payload?: IDMTrendDatum;
};

export function IdmTrendChart({
  data,
  loading,
}: {
  data: IDMTrendDatum[];
  loading?: boolean;
}) {
  const availableData = data.filter(
    (item): item is IDMTrendDatum & { value: number } =>
      typeof item.value === "number" && Number.isFinite(item.value),
  );
  const [domainMin, domainMax] = getNumberDomain(
    availableData.map((item) => item.value),
    0.03,
  );

  return (
    <ChartPanel
      title="Tren Nilai IDM Rata-rata"
      subtitle="Perubahan TA 2025-2026"
      ariaLabel="Grafik tren rata-rata IDM tahun 2025 sampai 2026"
    >
      {loading ? (
        <ChartSkeleton />
      ) : availableData.length === 0 ? (
        <ChartEmptyState>Data tren IDM belum tersedia.</ChartEmptyState>
      ) : (
        <div className="space-y-2">
          {availableData.length < 2 ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              Data tren IDM belum lengkap.
            </p>
          ) : null}
          <div className="h-[238px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 22, right: 24, bottom: 8, left: 0 }}
              >
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 12, fill: "#334155" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[domainMin, domainMax]}
                  tickFormatter={formatIdm}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  width={52}
                />
                <Tooltip content={<TrendTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#1e3a8a"
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                >
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={formatIdmLabel}
                    className="fill-pbd-navy text-xs font-bold"
                  />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </ChartPanel>
  );
}

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TrendTooltipPayload[];
}) {
  if (!active || !payload?.length || !payload[0]?.payload) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
      <p className="font-bold text-pbd-navy">TA {item.year}</p>
      <p className="mt-1 text-slate-600">
        Rata-rata IDM: {formatIdm(item.value)}
      </p>
    </div>
  );
}
