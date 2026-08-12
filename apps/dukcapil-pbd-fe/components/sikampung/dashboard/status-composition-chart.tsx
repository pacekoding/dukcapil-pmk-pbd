"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import {
  ChartEmptyState,
  ChartPanel,
  ChartSkeleton,
} from "@/components/sikampung/dashboard/chart-utils";
import type { IDMStatusDatum, IdmYear } from "./idm-chart-types";

const STATUS_COLORS: Record<IDMStatusDatum["key"], string> = {
  sangat_tertinggal: "#991b1b",
  tertinggal: "#ea580c",
  berkembang: "#2563eb",
  maju: "#1e3a8a",
  mandiri: "#047857",
};

type StatusTooltipPayload = {
  payload?: IDMStatusDatum;
};

export function StatusCompositionChart({
  year,
  data,
  loading,
}: {
  year: IdmYear;
  data: IDMStatusDatum[];
  loading?: boolean;
}) {
  const totalKampung = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartPanel
      title={`Komposisi Status Kampung (Total ${totalKampung})`}
      ariaLabel={`Grafik komposisi status kampung IDM tahun ${year}`}
    >
      {loading ? (
        <ChartSkeleton />
      ) : totalKampung === 0 ? (
        <ChartEmptyState>Belum ada data IDM untuk TA {year}</ChartEmptyState>
      ) : (
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="52%"
                outerRadius="78%"
                paddingAngle={2}
                labelLine={false}
                label={(props) => renderStatusLabel(props, totalKampung)}
              >
                {data.map((item) => (
                  <Cell key={item.key} fill={STATUS_COLORS[item.key]} />
                ))}
              </Pie>
              <Tooltip content={<StatusTooltip total={totalKampung} />} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: 12, lineHeight: "18px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartPanel>
  );
}

function renderStatusLabel(props: unknown, total: number) {
  if (!isPieLabelProps(props) || total === 0) {
    return "";
  }

  const value = Number(props.value);
  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }

  const percent = Math.round((value / total) * 100);
  return `${value} (${percent}%)`;
}

function isPieLabelProps(
  value: unknown,
): value is { value?: number | string } {
  return typeof value === "object" && value !== null && "value" in value;
}

function StatusTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: StatusTooltipPayload[];
  total: number;
}) {
  if (!active || !payload?.length || !payload[0]?.payload) {
    return null;
  }

  const item = payload[0].payload;
  const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
      <p className="font-bold text-pbd-navy">{item.name}</p>
      <p className="mt-1 text-slate-600">{item.value} Kampung</p>
      <p className="text-slate-500">{percent}%</p>
    </div>
  );
}
