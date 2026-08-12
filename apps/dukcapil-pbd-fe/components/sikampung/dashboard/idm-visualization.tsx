"use client";

import { SectionCard } from "@/components/dashboard/section-card";
import { IdmTrendChart } from "@/components/sikampung/dashboard/idm-trend-chart";
import { IndexComponentChart } from "@/components/sikampung/dashboard/index-component-chart";
import { StatusCompositionChart } from "@/components/sikampung/dashboard/status-composition-chart";
import type {
  IDMComponentDatum,
  IDMStatusDatum,
  IDMTrendDatum,
  IdmYear,
} from "./idm-chart-types";

export function IdmVisualization({
  year,
  statusData,
  componentData,
  averageIdm,
  trendData,
  loading,
  error,
}: {
  year: IdmYear;
  statusData: IDMStatusDatum[];
  componentData: IDMComponentDatum[];
  averageIdm: number | null;
  trendData: IDMTrendDatum[];
  loading?: boolean;
  error?: string | null;
}) {
  return (
    <SectionCard
      title={`Visualisasi Data Kampung IDM ${year}`}
      description="Pantau komposisi status kampung, nilai indeks pembentuk IDM, dan tren rata-rata IDM antar tahun operasional."
      contentClassName="space-y-4"
    >
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatusCompositionChart
          year={year}
          data={statusData}
          loading={loading}
        />
        <IndexComponentChart
          year={year}
          data={componentData}
          averageIdm={averageIdm}
          loading={loading}
        />
        <IdmTrendChart data={trendData} loading={loading} />
      </div>
    </SectionCard>
  );
}
