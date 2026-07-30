"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Database,
  Home,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDashboardDataWilayah } from "@/lib/api/data-wilayah";
import {
  formatNumber,
  getProvinceTotals,
} from "@/lib/data-wilayah";
import type { RegionData } from "@/types/data-wilayah";

export default function DashboardPage() {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [tahunAnggaran, setTahunAnggaran] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getDashboardDataWilayah();

        if (!mounted) {
          return;
        }

        setRegions(data.regions);
        setTahunAnggaran(data.tahunAnggaran);
      } catch (loadError) {
        console.error(loadError);

        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Data agregat dashboard gagal dimuat.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, [reloadKey]);

  const totals = useMemo(() => getProvinceTotals(regions), [regions]);
  const displayValue = (value: number) =>
    loading ? "..." : error ? "—" : formatNumber(value);

  const stats = [
    {
      label: "Total Penduduk",
      value: displayValue(totals.totalJiwa),
      description: "Total penduduk Provinsi Papua Barat Daya",
      icon: Users,
      tone: "blue" as const,
    },
    {
      label: "Penduduk OAP",
      value: displayValue(totals.totalOap),
      description: "Jumlah penduduk Orang Asli Papua",
      icon: ShieldCheck,
      tone: "emerald" as const,
    },
    {
      label: "Desa/Kampung IDM",
      value: displayValue(totals.totalDesaIdm),
      description: "Jumlah desa/kampung yang memiliki klasifikasi IDM",
      icon: Home,
      tone: "indigo" as const,
    },
    {
      label: "BUMDes/BUMKam",
      value: displayValue(totals.totalBumdes),
      description: "Jumlah badan usaha milik desa/kampung",
      icon: Building2,
      tone: "amber" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHero
        icon={Database}
        eyebrow="Data Agregat Prioritas"
        title="Dashboard"
        description="Ringkasan indikator prioritas Dinas Dukcapil dan PMK Provinsi Papua Barat Daya."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
              Tahun {tahunAnggaran || "—"}
            </Badge>
            <Badge
              variant="outline"
              className="h-8 rounded-full bg-white px-4 text-sm font-bold text-slate-600"
            >
              {regions.length} kabupaten/kota
            </Badge>
          </div>
        }
      />

      {error ? (
        <section className="app-surface flex flex-col gap-4 rounded-lg border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-red-800">
              Data agregat gagal dimuat
            </h2>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setReloadKey((current) => current + 1)}
            className="border-red-200 bg-white text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4" />
            Muat ulang
          </Button>
        </section>
      ) : null}

      <section
        aria-label="Ringkasan data agregat prioritas"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>
    </div>
  );
}
