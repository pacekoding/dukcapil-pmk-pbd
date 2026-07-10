"use client";

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

const dashboardStats = [
  {
    label: "Kampung/Desa",
    value: "8",
    description: "Data awal wilayah kampung/desa",
    icon: Database,
    tone: "blue" as const,
  },
  {
    label: "Kab/Kota",
    value: "4",
    description: "Sebaran data tersedia",
    icon: MapPinned,
    tone: "emerald" as const,
  },
  {
    label: "Status Aktif",
    value: "7",
    description: "Kampung/desa aktif",
    icon: Navigation,
    tone: "indigo" as const,
  },
];

export default function SikampungDashboardPage() {
  return (
    <main className="space-y-6">
      <PageHero
        icon={MapPinned}
        eyebrow="SIKAMPUNG"
        title="Sistem Informasi Kampung/Desa"
        description="Dashboard untuk mengelola data kampung/desa dan wilayah administrasi pada lingkungan Dinas Dukcapil dan PMK Provinsi Papua Barat Daya."
        meta={
          <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
            Modul data kampung/desa
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
        title="Menu SIKAMPUNG"
        description="Gunakan menu Data untuk mengelola data kab/kota, distrik, kampung/desa, kode wilayah, status, dan catatan."
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
              <h2 className="font-bold text-pbd-navy">Data Kampung/Desa</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Kelola data kampung/desa dengan kolom nama kab/kota, nama
                distrik, nama kampung/desa, kode wilayah, status, dan catatan.
              </p>
            </div>
          </div>
          <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
        </Link>
      </SectionCard>
    </main>
  );
}
