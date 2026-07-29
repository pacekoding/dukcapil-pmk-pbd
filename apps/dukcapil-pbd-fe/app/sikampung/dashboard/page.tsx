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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSikampungData } from "@/lib/api/sikampung";
import type { SikampungData } from "@/types/sikampung";

export default function SikampungDashboardPage() {
  const [records, setRecords] = useState<SikampungData[]>([]);
  const [tahunAnggaran, setTahunAnggaran] = useState("");

  async function loadData() {
    try {
      const response = await getSikampungData();
      setRecords(response.items);
      setTahunAnggaran(response.tahunAnggaran);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

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
        description: `Data IDM ${tahunAnggaran || "aktif"}`,
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
  }, [records, tahunAnggaran]);

  return (
    <main className="space-y-6">
      <PageHero
        icon={MapPinned}
        eyebrow="SIKAMPUNG"
        title="Sistem Informasi Kampung IDM"
        description="Dashboard untuk mengelola data kampung berdasarkan Kode Desa, IKS, IKE, IKL, Nilai IDM, dan Status IDM."
        meta={
          <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
            Data kampung IDM
          </Badge>
        }
        aside={
          <div className="flex flex-wrap gap-3">
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
