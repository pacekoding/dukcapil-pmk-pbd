"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Database,
  FileArchive,
  FileText,
  UploadCloud,
} from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const dashboardStats = [
  {
    label: "Dokumen",
    value: "-",
    description: "Dokumen pelaksanaan Dukcapil",
    icon: FileArchive,
    tone: "blue" as const,
  },
  {
    label: "Subkegiatan",
    value: "2.12",
    description: "Prefix subkegiatan Dukcapil",
    icon: ClipboardList,
    tone: "indigo" as const,
  },
  {
    label: "DSSD",
    value: "-",
    description: "Dokumen bertanda DSSD",
    icon: Database,
    tone: "emerald" as const,
  },
];

export default function SidakDashboardPage() {
  return (
    <main className="space-y-6">
      <PageHero
        icon={ClipboardList}
        eyebrow="SIDAK"
        title="Sistem Informasi Data Kegiatan Dukcapil"
        description="Dashboard untuk mengelola dokumen pelaksanaan kegiatan Dukcapil dengan subkegiatan prefix 2.12 pada lingkungan Dinas Dukcapil dan PMK Provinsi Papua Barat Daya."
        meta={
          <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
            Modul kegiatan Dukcapil
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
              <Link href="/sidak/data">
                <UploadCloud className="h-4 w-4" />
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
        title="Menu SIDAK"
        description="Gunakan menu Data Pelaksanaan untuk mengupload dan mengelola dokumen pelaksanaan kegiatan Dukcapil."
      >
        <Link
          href="/sidak/data"
          className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5 transition hover:border-pbd-blue/30 hover:bg-blue-50"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue ring-1 ring-blue-100">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-pbd-navy">Data Pelaksanaan</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Kelola dokumen pelaksanaan Dukcapil dengan subkegiatan prefix
                2.12, status DSSD, dan tanggal upload.
              </p>
            </div>
          </div>
          <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
        </Link>
      </SectionCard>
    </main>
  );
}
