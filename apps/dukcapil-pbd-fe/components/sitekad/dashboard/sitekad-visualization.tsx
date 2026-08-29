"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SectionCard } from "@/components/dashboard/section-card";
import type {
  SitekadCapaianKendala,
  SitekadKategoriUsaha,
  SitekadPotensiKampung,
} from "@/types/sitekad";
import { sitekadKategoriUsahaOptions } from "@/types/sitekad";

type CategoryDatum = {
  key: SitekadKategoriUsaha;
  name: SitekadKategoriUsaha;
  value: number;
  dana: number;
};

type KabupatenDatum = {
  name: string;
  kelompok: number;
  capaian: number;
  dana: number;
};

type CommodityDatum = {
  name: string;
  value: number;
  dana: number;
};

const CATEGORY_COLORS: Record<SitekadKategoriUsaha, string> = {
  Pertanian: "#047857",
  Perikanan: "#0e7490",
  "Perikanan Darat": "#2563eb",
  "Perikanan Laut": "#1d4ed8",
  Peternakan: "#b45309",
  Perkebunan: "#65a30d",
  Pariwisata: "#7c3aed",
  Perdagangan: "#db2777",
  Kerajinan: "#f59e0b",
  Jasa: "#64748b",
  Lainnya: "#475569",
};

const FALLBACK_COLOR = "#64748b";

type TooltipPayload<T> = {
  payload?: T;
  dataKey?: string;
  color?: string;
  value?: number;
  name?: string;
};

export function SitekadVisualization({
  records,
  capaian,
  loading,
  error,
}: {
  records: SitekadPotensiKampung[];
  capaian: SitekadCapaianKendala[];
  loading?: boolean;
  error?: boolean;
}) {
  const categoryData = buildCategoryData(records);
  const kabupatenData = buildKabupatenData(records, capaian);
  const fundingData = [...categoryData]
    .filter((item) => item.dana > 0)
    .sort((a, b) => b.dana - a.dana)
    .slice(0, 6);
  const commodityData = buildCommodityData(records);
  const topKabupaten = kabupatenData[0];
  const topCategory = categoryData[0];
  const averageAllocation = records.length
    ? records.reduce((total, record) => total + record.danaAlokasi, 0) /
      records.length
    : 0;

  return (
    <SectionCard
      title="Visualisasi Program TEKAD"
      description="Baca komposisi sektor usaha, sebaran lokus, alokasi dana, dan komoditas dominan dari data kelompok binaan SITEKAD."
      contentClassName="space-y-4"
    >
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          Data visualisasi SITEKAD gagal dimuat.
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-3">
        <InsightStrip
          label="Kabupaten Terbanyak"
          value={topKabupaten?.name ?? "-"}
          description={
            topKabupaten
              ? `${topKabupaten.kelompok} kelompok binaan`
              : "Belum ada data lokus"
          }
        />
        <InsightStrip
          label="Kategori Dominan"
          value={topCategory?.name ?? "-"}
          description={
            topCategory ? `${topCategory.value} kelompok` : "Belum ada kategori"
          }
        />
        <InsightStrip
          label="Rata-rata Alokasi"
          value={records.length ? formatCurrencyCompact(averageAllocation) : "-"}
          description={
            records.length ? "Per kelompok binaan" : "Belum ada alokasi"
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
        <CategoryCompositionChart data={categoryData} loading={loading} />
        <KabupatenProgressChart data={kabupatenData} loading={loading} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <FundingCategoryChart data={fundingData} loading={loading} />
        <CommodityRanking data={commodityData} loading={loading} />
      </div>
    </SectionCard>
  );
}

function CategoryCompositionChart({
  data,
  loading,
}: {
  data: CategoryDatum[];
  loading?: boolean;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartPanel
      title="Komposisi Kategori Usaha"
      subtitle="Proporsi kelompok binaan menurut sektor ekonomi"
      ariaLabel="Grafik komposisi kategori usaha SITEKAD"
    >
      {loading ? (
        <ChartSkeleton />
      ) : total === 0 ? (
        <ChartEmptyState>Belum ada data kategori usaha.</ChartEmptyState>
      ) : (
        <div className="h-[280px] w-full">
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
                  <Cell
                    key={item.key}
                    fill={CATEGORY_COLORS[item.key] ?? FALLBACK_COLOR}
                  />
                ))}
              </Pie>
              <Tooltip content={<CategoryTooltip total={total} />} />
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

function KabupatenProgressChart({
  data,
  loading,
}: {
  data: KabupatenDatum[];
  loading?: boolean;
}) {
  const hasData = data.some((item) => item.kelompok > 0 || item.capaian > 0);
  const domainMax = Math.max(
    1,
    ...data.map((item) => Math.max(item.kelompok, item.capaian)),
  );

  return (
    <ChartPanel
      title="Sebaran Lokus & Capaian"
      subtitle="Perbandingan jumlah kelompok dan riwayat capaian per kabupaten"
      ariaLabel="Grafik sebaran kelompok dan capaian SITEKAD per kabupaten"
    >
      {loading ? (
        <ChartSkeleton />
      ) : !hasData ? (
        <ChartEmptyState>Belum ada data lokus SITEKAD.</ChartEmptyState>
      ) : (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 28, bottom: 8, left: 8 }}
              barGap={4}
            >
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis
                type="number"
                allowDecimals={false}
                domain={[0, Math.ceil(domainMax * 1.18)]}
                tick={{ fontSize: 11, fill: "#64748b" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 12, fill: "#334155" }}
              />
              <Tooltip content={<KabupatenTooltip />} />
              <Legend
                verticalAlign="top"
                iconType="circle"
                wrapperStyle={{ fontSize: 12, lineHeight: "18px" }}
              />
              <Bar
                dataKey="kelompok"
                name="Kelompok"
                fill="#2563eb"
                radius={[0, 6, 6, 0]}
              >
                <LabelList
                  dataKey="kelompok"
                  position="right"
                  className="fill-pbd-navy text-xs font-bold"
                />
              </Bar>
              <Bar
                dataKey="capaian"
                name="Capaian"
                fill="#059669"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartPanel>
  );
}

function FundingCategoryChart({
  data,
  loading,
}: {
  data: CategoryDatum[];
  loading?: boolean;
}) {
  const hasData = data.some((item) => item.dana > 0);
  const domainMax = Math.max(1, ...data.map((item) => item.dana));

  return (
    <ChartPanel
      title="Alokasi Dana per Kategori"
      subtitle="Enam kategori dengan total alokasi terbesar"
      ariaLabel="Grafik alokasi dana SITEKAD per kategori usaha"
    >
      {loading ? (
        <ChartSkeleton />
      ) : !hasData ? (
        <ChartEmptyState>Belum ada data alokasi dana.</ChartEmptyState>
      ) : (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 54, bottom: 8, left: 4 }}
            >
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[0, Math.ceil(domainMax * 1.16)]}
                tickFormatter={formatCurrencyCompact}
                tick={{ fontSize: 11, fill: "#64748b" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={116}
                tick={{ fontSize: 12, fill: "#334155" }}
              />
              <Tooltip content={<FundingTooltip />} />
              <Bar dataKey="dana" fill="#f59e0b" radius={[0, 6, 6, 0]}>
                <LabelList
                  dataKey="dana"
                  position="right"
                  formatter={formatCurrencyLabel}
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

function CommodityRanking({
  data,
  loading,
}: {
  data: CommodityDatum[];
  loading?: boolean;
}) {
  const maxValue = Math.max(1, ...data.map((item) => item.value));

  return (
    <ChartPanel
      title="Komoditas Unggulan"
      subtitle="Kelompok terbanyak menurut komoditas"
      ariaLabel="Peringkat komoditas unggulan SITEKAD"
    >
      {loading ? (
        <ChartSkeleton />
      ) : data.length === 0 ? (
        <ChartEmptyState>Belum ada data komoditas.</ChartEmptyState>
      ) : (
        <div className="space-y-3">
          {data.map((item, index) => {
            const width = `${Math.max(10, (item.value / maxValue) * 100)}%`;
            return (
              <div key={item.name} className="rounded-md border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-pbd-navy">
                      {index + 1}. {item.name}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {formatCurrencyCompact(item.dana)} alokasi
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                    {item.value} kelompok
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ChartPanel>
  );
}

function InsightStrip({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 truncate text-base font-extrabold text-pbd-navy">
        {value}
      </p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function ChartPanel({
  title,
  subtitle,
  ariaLabel,
  children,
}: {
  title: string;
  subtitle: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={ariaLabel}
      className="flex min-h-[340px] flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="min-w-0">
        <h3 className="text-sm font-bold leading-5 text-pbd-navy">{title}</h3>
        <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
          {subtitle}
        </p>
      </div>
      <div className="mt-4 min-h-0 flex-1">{children}</div>
    </section>
  );
}

function ChartEmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[268px] items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm font-semibold leading-6 text-slate-500">
      {children}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-[268px] animate-pulse rounded-md border border-slate-100 bg-slate-50">
      <div className="flex h-full items-end gap-3 p-5">
        <div className="h-24 flex-1 rounded bg-slate-200" />
        <div className="h-40 flex-1 rounded bg-slate-200" />
        <div className="h-32 flex-1 rounded bg-slate-200" />
        <div className="h-48 flex-1 rounded bg-slate-200" />
      </div>
    </div>
  );
}

function CategoryTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: TooltipPayload<CategoryDatum>[];
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
      <p className="mt-1 text-slate-600">{item.value} kelompok</p>
      <p className="text-slate-500">{percent}% komposisi</p>
      <p className="text-slate-500">{formatCurrency(item.dana)}</p>
    </div>
  );
}

function KabupatenTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload<KabupatenDatum>[];
}) {
  if (!active || !payload?.length || !payload[0]?.payload) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
      <p className="font-bold text-pbd-navy">{item.name}</p>
      <p className="mt-1 text-slate-600">{item.kelompok} kelompok binaan</p>
      <p className="text-slate-600">{item.capaian} capaian tercatat</p>
      <p className="text-slate-500">{formatCurrency(item.dana)}</p>
    </div>
  );
}

function FundingTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload<CategoryDatum>[];
}) {
  if (!active || !payload?.length || !payload[0]?.payload) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
      <p className="font-bold text-pbd-navy">{item.name}</p>
      <p className="mt-1 text-slate-600">{formatCurrency(item.dana)}</p>
      <p className="text-slate-500">{item.value} kelompok binaan</p>
    </div>
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
  return percent >= 8 ? `${percent}%` : "";
}

function isPieLabelProps(
  value: unknown,
): value is { value?: number | string } {
  return typeof value === "object" && value !== null && "value" in value;
}

function buildCategoryData(records: SitekadPotensiKampung[]) {
  const data = new Map<SitekadKategoriUsaha, CategoryDatum>();
  for (const option of sitekadKategoriUsahaOptions) {
    data.set(option, {
      key: option,
      name: option,
      value: 0,
      dana: 0,
    });
  }

  for (const record of records) {
    const current =
      data.get(record.kategoriUsaha) ??
      ({
        key: record.kategoriUsaha,
        name: record.kategoriUsaha,
        value: 0,
        dana: 0,
      } satisfies CategoryDatum);
    current.value += 1;
    current.dana += record.danaAlokasi;
    data.set(record.kategoriUsaha, current);
  }

  return Array.from(data.values())
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value || b.dana - a.dana);
}

function buildKabupatenData(
  records: SitekadPotensiKampung[],
  capaian: SitekadCapaianKendala[],
) {
  const data = new Map<string, KabupatenDatum>();

  for (const record of records) {
    const name = record.kabupatenKota || "Tanpa Kabupaten";
    const current = data.get(name) ?? {
      name,
      kelompok: 0,
      capaian: 0,
      dana: 0,
    };
    current.kelompok += 1;
    current.dana += record.danaAlokasi;
    data.set(name, current);
  }

  for (const item of capaian) {
    const name = item.kelompok.kabupatenKota || "Tanpa Kabupaten";
    const current = data.get(name) ?? {
      name,
      kelompok: 0,
      capaian: 0,
      dana: 0,
    };
    current.capaian += 1;
    data.set(name, current);
  }

  return Array.from(data.values()).sort(
    (a, b) => b.kelompok - a.kelompok || b.capaian - a.capaian,
  );
}

function buildCommodityData(records: SitekadPotensiKampung[]) {
  const data = new Map<string, CommodityDatum>();

  for (const record of records) {
    const values = splitCommodities(record.komoditas);
    for (const name of values) {
      const current = data.get(name) ?? {
        name,
        value: 0,
        dana: 0,
      };
      current.value += 1;
      current.dana += record.danaAlokasi;
      data.set(name, current);
    }
  }

  return Array.from(data.values())
    .sort((a, b) => b.value - a.value || b.dana - a.dana)
    .slice(0, 5);
}

function splitCommodities(value: string) {
  return value
    .split(/[,;/]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrencyCompact(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatCurrencyLabel(value: unknown) {
  return typeof value === "number" ? formatCurrencyCompact(value) : "";
}
