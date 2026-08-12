"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Database,
  FileText,
  MapPinned,
  Navigation,
} from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { IdmVisualization } from "@/components/sikampung/dashboard/idm-visualization";
import {
  IDM_YEARS,
  type IDMComponentDatum,
  type IDMStatusDatum,
  type IDMTrendDatum,
  type IdmYear,
} from "@/components/sikampung/dashboard/idm-chart-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSikampungData } from "@/lib/api/sikampung";
import type { SikampungData, SikampungStatusIDM } from "@/types/sikampung";

const latestIdmYear = IDM_YEARS[IDM_YEARS.length - 1];
const emptySikampungRecords: SikampungData[] = [];

const statusOrder: Array<{
  key: IDMStatusDatum["key"];
  name: SikampungStatusIDM;
}> = [
  { key: "sangat_tertinggal", name: "Sangat Tertinggal" },
  { key: "tertinggal", name: "Tertinggal" },
  { key: "berkembang", name: "Berkembang" },
  { key: "maju", name: "Maju" },
  { key: "mandiri", name: "Mandiri" },
];

export default function SikampungDashboardPage() {
  const [recordsByYear, setRecordsByYear] = useState<
    Partial<Record<IdmYear, SikampungData[]>>
  >({});
  const [selectedYear, setSelectedYear] = useState<IdmYear>(latestIdmYear);
  const [availableYears, setAvailableYears] = useState<IdmYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [visualizationError, setVisualizationError] = useState<string | null>(
    null,
  );

  async function loadData() {
    setLoading(true);
    setVisualizationError(null);

    try {
      const responses = await Promise.allSettled(
        IDM_YEARS.map(async (year) => ({
          year,
          response: await getSikampungData(String(year)),
        })),
      );

      const nextRecordsByYear: Partial<Record<IdmYear, SikampungData[]>> = {};
      const nextAvailableYears: IdmYear[] = [];

      for (const result of responses) {
        if (result.status === "fulfilled") {
          nextRecordsByYear[result.value.year] = result.value.response.items;
          nextAvailableYears.push(result.value.year);
        }
      }

      if (nextAvailableYears.length === 0) {
        throw new Error("data tahun SIKAMPUNG tidak tersedia");
      }

      const latestAvailableYear = [...nextAvailableYears].sort(
        (a, b) => b - a,
      )[0];

      setRecordsByYear(nextRecordsByYear);
      setAvailableYears(nextAvailableYears);
      setSelectedYear((current) =>
        nextAvailableYears.includes(current) ? current : latestAvailableYear,
      );
    } catch (error) {
      console.error(error);
      setRecordsByYear({});
      setAvailableYears([]);
      setVisualizationError("Data visualisasi IDM gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const records = useMemo(
    () => recordsByYear[selectedYear] ?? emptySikampungRecords,
    [recordsByYear, selectedYear],
  );

  const dashboardStats = useMemo(() => {
    const kabupatenCount = new Set(records.map((record) => record.kabupaten)).size;
    const tertinggalCount = records.filter((record) =>
      ["Tertinggal", "Sangat Tertinggal"].includes(record.statusIdm),
    ).length;
    const avgNilaiIdm = records.length
      ? records.reduce((total, record) => total + record.nilaiIdm, 0) /
        records.length
      : 0;

    return [
      {
        label: "Kampung",
        value: String(records.length),
        description: `Data IDM ${selectedYear}`,
        icon: Database,
        tone: "blue" as const,
      },
      {
        label: "Kabupaten",
        value: String(kabupatenCount),
        description: "Sebaran administrasi",
        icon: MapPinned,
        tone: "emerald" as const,
      },
      {
        label: "Tertinggal",
        value: String(tertinggalCount),
        description: "Tertinggal dan sangat tertinggal",
        icon: Navigation,
        tone: "indigo" as const,
      },
      {
        label: "Rata-rata IDM",
        value: avgNilaiIdm.toFixed(4),
        description: "Rata-rata nilai kampung",
        icon: FileText,
        tone: "slate" as const,
      },
    ];
  }, [records, selectedYear]);

  const statusData = useMemo(
    () => buildStatusData(records),
    [records],
  );

  const componentData = useMemo(
    () => buildComponentData(records),
    [records],
  );

  const averageIdm = useMemo(
    () => calculateAverage(records, "nilaiIdm"),
    [records],
  );

  const trendData = useMemo<IDMTrendDatum[]>(
    () =>
      IDM_YEARS.map((year) => ({
        year,
        value: calculateAverage(recordsByYear[year] ?? [], "nilaiIdm"),
      })),
    [recordsByYear],
  );

  return (
    <main className="space-y-6">
      <PageHero
        icon={MapPinned}
        eyebrow="SIKAMPUNG"
        title="Sistem Informasi Kampung IDM"
        description="Dashboard untuk mengelola data kampung berdasarkan Kode Desa, IKS, IKE, IKL, Nilai IDM, dan Status IDM."
        meta={
          <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
            {loading ? "Memuat data..." : `TA ${selectedYear}`}
          </Badge>
        }
        aside={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
              <span className="text-xs font-bold uppercase text-slate-500">
                TA
              </span>
              <Select
                value={String(selectedYear)}
                onValueChange={(value) =>
                  setSelectedYear(Number(value) as IdmYear)
                }
                disabled={loading || availableYears.length === 0}
              >
                <SelectTrigger
                  aria-label="Pilih tahun data kampung IDM"
                  className="h-8 w-[112px] border-0 bg-transparent px-0 shadow-none focus:ring-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      TA {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link href="/portal">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Portal
              </Link>
            </Button>
            <Button
              asChild
              className="h-11 rounded-xl bg-pbd-navy text-white hover:bg-pbd-navy/90"
            >
              <Link href="/sikampung/data">
                <Database className="h-4 w-4" />
                Buka Data
              </Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((item) => (
          <StatCard
            key={item.label}
            label={item.label}
            value={item.value}
            description={item.description}
            icon={item.icon}
            tone={item.tone}
          />
        ))}
      </section>

      <IdmVisualization
        year={selectedYear}
        statusData={statusData}
        componentData={componentData}
        averageIdm={averageIdm}
        trendData={trendData}
        loading={loading}
        error={visualizationError}
      />

      <SectionCard
        title="Menu SIKAMPUNG"
        description="Gunakan menu Data untuk mengelola kode desa, desa, distrik, kabupaten, IKS, IKE, IKL, nilai IDM, dan status IDM."
      >
        <Link
          href="/sikampung/data"
          className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5 transition hover:border-pbd-blue/30 hover:bg-blue-50"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue ring-1 ring-blue-100">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-pbd-navy">Data Kampung IDM</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Kelola data kampung dengan kolom Kode Desa, Desa, Distrik,
                Kabupaten, IKS, IKE, IKL, Nilai IDM, dan Status IDM.
              </p>
            </div>
          </div>
          <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
        </Link>
      </SectionCard>
    </main>
  );
}

function buildStatusData(records: SikampungData[]): IDMStatusDatum[] {
  return statusOrder.map((status) => ({
    ...status,
    value: records.filter((record) => record.statusIdm === status.name).length,
  }));
}

function buildComponentData(records: SikampungData[]): IDMComponentDatum[] {
  return [
    {
      code: "IKS",
      label: "IKS (Sosial)",
      value: calculateAverage(records, "iks") ?? 0,
    },
    {
      code: "IKE",
      label: "IKE (Ekonomi)",
      value: calculateAverage(records, "ike") ?? 0,
    },
    {
      code: "IKL",
      label: "IKL (Lingkungan)",
      value: calculateAverage(records, "ikl") ?? 0,
    },
  ];
}

function calculateAverage(
  records: SikampungData[],
  key: "iks" | "ike" | "ikl" | "nilaiIdm",
) {
  if (records.length === 0) {
    return null;
  }

  return (
    records.reduce((total, record) => total + record[key], 0) / records.length
  );
}
