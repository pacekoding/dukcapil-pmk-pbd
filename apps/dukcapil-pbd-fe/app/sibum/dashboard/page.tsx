"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Database,
  FileText,
  MapPinned,
} from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getBumKampung } from "@/lib/api/bum-kampung";
import type { BumKampung } from "@/types/bum-kampung";

export default function SibumKampungPage() {
  const [records, setRecords] = useState<BumKampung[]>([]);
  const [tahunAnggaran, setTahunAnggaran] = useState("2026");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const data = await getBumKampung();
        if (mounted) {
          setRecords(data.items);
          setTahunAnggaran(data.tahunAnggaran);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const dashboardStats = useMemo(() => {
    const kabupatenKotaCount = new Set(
      records.map((record) => record.kabupatenKota),
    ).size;
    const kampungCount = new Set(
      records.map(
        (record) =>
          `${record.kabupatenKota}-${record.distrik}-${record.kampung}`,
      ),
    ).size;
    const verifiedCount = records.filter(
      (record) =>
        record.status === "Dokumen Badan Hukum Terverifikasi" ||
        record.status === "Nama Terverifikasi",
    ).length;

    return [
      {
        label: "BUMKam Terdata",
        value: loading ? "..." : String(records.length),
        description: `Tahun anggaran ${tahunAnggaran}`,
        icon: Database,
        tone: "blue" as const,
      },
      {
        label: "Kab/Kota",
        value: loading ? "..." : String(kabupatenKotaCount),
        description: "Sebaran data tersedia",
        icon: MapPinned,
        tone: "emerald" as const,
      },
      {
        label: "Status Terverifikasi",
        value: loading ? "..." : String(verifiedCount),
        description: `${kampungCount} kampung terdata`,
        icon: Building2,
        tone: "indigo" as const,
      },
    ];
  }, [loading, records, tahunAnggaran]);

  return (
    <main className="space-y-6">
      <PageHero
        icon={Building2}
        eyebrow="SIBUM Kampung"
        title="Sistem Informasi BUM Kampung"
        description="Dashboard untuk mengelola data BUMKam pada lingkungan Dinas Dukcapil dan PMK Provinsi Papua Barat Daya."
        meta={
          <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
            Modul aktif dalam penyiapan
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
              <Link href="/sibum/data">
                <Database className="h-4 w-4" />
                Buka Data
              </Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
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
        title="Menu SIBUM Kampung"
        description="Gunakan menu Data untuk mengelola data BUMKam kabupaten/kota, distrik, kampung, kategori, dan status."
      >
        <Link
          href="/sibum/data"
          className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5 transition hover:border-pbd-blue/30 hover:bg-blue-50"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue ring-1 ring-blue-100">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-pbd-navy">Data BUMKam</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Kelola data BUMKam dengan kolom nama kab/kota, nama distrik,
                nama kampung, nama BUM Kampung, kategori, dan status.
              </p>
            </div>
          </div>
          <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
        </Link>
      </SectionCard>
    </main>
  );
}
