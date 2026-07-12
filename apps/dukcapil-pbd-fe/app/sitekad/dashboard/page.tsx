"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Database,
  MapPinned,
  WalletCards,
} from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSitekadPotensiKampung } from "@/lib/api/sitekad";
import type { SitekadPotensiKampung } from "@/types/sitekad";

export default function SitekadDashboardPage() {
  const [records, setRecords] = useState<SitekadPotensiKampung[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const data = await getSitekadPotensiKampung();
        if (mounted) {
          setRecords(data.items);
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
    const kabupatenCount = new Set(
      records.map((record) => record.kabupatenKota),
    ).size;
    const totalDana = records.reduce(
      (total, record) => total + record.danaAlokasi,
      0,
    );

    return [
      {
        label: "Potensi Kampung",
        value: loading ? "..." : String(records.length),
        description: "Data evaluasi terinput",
        icon: ClipboardList,
        tone: "blue" as const,
      },
      {
        label: "Kabupaten",
        value: loading ? "..." : String(kabupatenCount),
        description: "Sebaran wilayah data",
        icon: MapPinned,
        tone: "emerald" as const,
      },
      {
        label: "Total Dana",
        value: loading ? "..." : formatCompactCurrency(totalDana),
        description: "Akumulasi alokasi",
        icon: WalletCards,
        tone: "indigo" as const,
      },
    ];
  }, [loading, records]);

  return (
    <main className="space-y-6">
      <PageHero
        icon={ClipboardList}
        eyebrow="SiTEKAD"
        title="Sistem Informasi Tekad"
        description="Dashboard untuk input dan pengelolaan data potensi kampung berdasarkan kabupaten, nama kampung, kategori usaha, dana alokasi, capaian, dan kendala lapangan."
        meta={
          <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
            {records.length} data potensi kampung
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
              <Link href="/sitekad/data">
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
        title="Menu SiTEKAD"
        description="Gunakan menu Data Potensi Kampung untuk menambah, mengubah, dan menghapus data evaluasi kampung."
      >
        <Link
          href="/sitekad/data"
          className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5 transition hover:border-pbd-blue/30 hover:bg-blue-50"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue ring-1 ring-blue-100">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-pbd-navy">Data Potensi Kampung</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Kelola kode data, kabupaten, kampung, kategori usaha, dana
                alokasi, capaian utama, dan kendala lapangan.
              </p>
            </div>
          </div>
          <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
        </Link>
      </SectionCard>
    </main>
  );
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 1,
  }).format(value);
}
