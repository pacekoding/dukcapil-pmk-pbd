"use client";

import { SectionCard } from "@/components/dashboard/section-card";
import { BumKabupatenChart } from "@/components/sibum/dashboard/bum-kabupaten-chart";
import { BumKategoriChart } from "@/components/sibum/dashboard/bum-kategori-chart";
import { BumStatusChart } from "@/components/sibum/dashboard/bum-status-chart";
import type {
  BumKabupatenDatum,
  BumKategoriDatum,
  BumStatusDatum,
} from "./bum-chart-types";

export function BumVisualization({
  year,
  statusData,
  kabupatenData,
  kategoriData,
  loading,
}: {
  year: string;
  statusData: BumStatusDatum[];
  kabupatenData: BumKabupatenDatum[];
  kategoriData: BumKategoriDatum[];
  loading?: boolean;
}) {
  return (
    <SectionCard
      title={`Visualisasi Data BUM Kampung ${year}`}
      description="Pantau komposisi status verifikasi, sebaran kabupaten/kota, dan kategori BUMKam berdasarkan data tahun anggaran aktif."
      contentClassName="space-y-4"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <BumStatusChart year={year} data={statusData} loading={loading} />
        <BumKabupatenChart
          year={year}
          data={kabupatenData}
          loading={loading}
        />
        <BumKategoriChart year={year} data={kategoriData} loading={loading} />
      </div>
    </SectionCard>
  );
}
