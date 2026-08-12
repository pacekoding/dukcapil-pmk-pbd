"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ReferenceLine,
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
import type { IDMComponentDatum, IdmYear } from "./idm-chart-types";

type ComponentTooltipPayload = {
  payload?: IDMComponentDatum;
};

export function IndexComponentChart({
  year,
  data,
  averageIdm,
  loading,
}: {
  year: IdmYear;
  data: IDMComponentDatum[];
  averageIdm: number | null;
  loading?: boolean;
}) {
  const hasData = data.some((item) => item.value > 0);
  const [domainMin, domainMax] = getNumberDomain(
    [...data.map((item) => item.value), averageIdm],
    0.05,
  );

  return (
    <ChartPanel
      title="Nilai Indeks per Komponen"
      ariaLabel={`Grafik nilai indeks per komponen IDM tahun ${year}`}
    >
      {loading ? (
        <ChartSkeleton />
      ) : !hasData ? (
        <ChartEmptyState>Belum ada data IDM untuk TA {year}</ChartEmptyState>
      ) : (
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 12, right: 48, bottom: 8, left: 4 }}
            >
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[domainMin, domainMax]}
                tickFormatter={formatIdm}
                tick={{ fontSize: 11, fill: "#64748b" }}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={104}
                tick={{ fontSize: 12, fill: "#334155" }}
              />
              <Tooltip content={<ComponentTooltip />} />
              {typeof averageIdm === "number" ? (
                <ReferenceLine
                  x={averageIdm}
                  stroke="#64748b"
                  strokeDasharray="3 3"
                  label={{
                    value: `Rerata: ${formatIdm(averageIdm)}`,
                    position: "insideTopRight",
                    fill: "#64748b",
                    fontSize: 11,
                  }}
                />
              ) : null}
              <Bar dataKey="value" fill="#2563eb" radius={[0, 6, 6, 0]}>
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={formatIdmLabel}
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

function ComponentTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ComponentTooltipPayload[];
}) {
  if (!active || !payload?.length || !payload[0]?.payload) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
      <p className="font-bold text-pbd-navy">{item.label}</p>
      <p className="mt-1 text-slate-600">Nilai: {formatIdm(item.value)}</p>
    </div>
  );
}
