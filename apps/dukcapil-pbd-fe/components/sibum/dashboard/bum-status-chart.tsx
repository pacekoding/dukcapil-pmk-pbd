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
import type { BumStatusDatum } from "./bum-chart-types";

const STATUS_COLORS: Record<BumStatusDatum["key"], string> = {
  "Dokumen Badan Hukum Terverifikasi": "#047857",
  "Nama Terverifikasi": "#2563eb",
  "Perbaikan Dokumen Badan Hukum": "#ea580c",
  "Perbaikan Nama": "#991b1b",
};

type StatusTooltipPayload = {
  payload?: BumStatusDatum;
};

export function BumStatusChart({
  year,
  data,
  loading,
}: {
  year: string;
  data: BumStatusDatum[];
  loading?: boolean;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartPanel
      title={`Komposisi Status Verifikasi (Total ${total})`}
      ariaLabel={`Grafik komposisi status verifikasi BUM Kampung tahun ${year}`}
    >
      {loading ? (
        <ChartSkeleton />
      ) : total === 0 ? (
        <ChartEmptyState>Belum ada data BUMKam untuk TA {year}</ChartEmptyState>
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
                label={(props) => renderCountLabel(props, total)}
              >
                {data.map((item) => (
                  <Cell key={item.key} fill={STATUS_COLORS[item.key]} />
                ))}
              </Pie>
              <Tooltip content={<StatusTooltip total={total} />} />
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

function renderCountLabel(props: unknown, total: number) {
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
      <p className="mt-1 text-slate-600">{item.value} BUMKam</p>
      <p className="text-slate-500">{percent}%</p>
    </div>
  );
}
