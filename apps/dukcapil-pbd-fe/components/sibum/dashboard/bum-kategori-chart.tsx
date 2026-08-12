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
import type { BumKategoriDatum } from "./bum-chart-types";

const KATEGORI_COLORS: Record<BumKategoriDatum["key"], string> = {
  BUMKam: "#1e3a8a",
  "BUMKam bersama": "#047857",
};

type KategoriTooltipPayload = {
  payload?: BumKategoriDatum;
};

export function BumKategoriChart({
  year,
  data,
  loading,
}: {
  year: string;
  data: BumKategoriDatum[];
  loading?: boolean;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartPanel
      title="Komposisi Kategori BUMKam"
      ariaLabel={`Grafik komposisi kategori BUM Kampung tahun ${year}`}
    >
      {loading ? (
        <ChartSkeleton />
      ) : total === 0 ? (
        <ChartEmptyState>Belum ada data kategori untuk TA {year}</ChartEmptyState>
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
                paddingAngle={3}
                labelLine={false}
                label={(props) => renderCountLabel(props, total)}
              >
                {data.map((item) => (
                  <Cell key={item.key} fill={KATEGORI_COLORS[item.key]} />
                ))}
              </Pie>
              <Tooltip content={<KategoriTooltip total={total} />} />
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

function KategoriTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: KategoriTooltipPayload[];
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
