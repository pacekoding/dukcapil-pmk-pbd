"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Layers3,
  Printer,
} from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const dashboardStats = [
  {
    label: "Template Form",
    value: "5",
    description: "Kelompok pertanyaan monitoring evaluasi",
    icon: Layers3,
    tone: "emerald" as const,
  },
  {
    label: "Bidang SSD",
    value: "2.12",
    description: "Subkegiatan Dukcapil dan PMK",
    icon: ClipboardCheck,
    tone: "blue" as const,
  },
  {
    label: "Output",
    value: "PDF",
    description: "Form siap cetak dan arsip",
    icon: Printer,
    tone: "indigo" as const,
  },
];

export default function SimonevDashboardPage() {
  return (
    <main className="space-y-6">
      <PageHero
        icon={ClipboardCheck}
        eyebrow="SIMONEV DUKCAPIL"
        title="Sistem Informasi Monitoring Evaluasi SSD"
        description="Dashboard untuk membuat formulir monitoring dan evaluasi data SSD Dukcapil dan PMK berdasarkan subkegiatan, periode, tingkat, dan responden."
        meta={
          <Badge className="h-8 rounded-full bg-emerald-50 px-4 text-sm font-bold text-emerald-700">
            Form monev siap cetak
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
              <Link href="/simonev/data">
                <FileCheck2 className="h-4 w-4" />
                Buat Form Monev
              </Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        {dashboardStats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </section>

      <SectionCard
        title="Menu SIMONEV"
        description="Buka halaman data untuk menyusun formulir monev dan melihat pratinjau dokumen sebelum dicetak."
      >
        <Link
          href="/simonev/data"
          className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5 transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-pbd-navy">Data Form Monev</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Pilih subkegiatan SSD, lengkapi info form, kelola daftar
                pertanyaan, lalu cetak atau simpan sebagai PDF.
              </p>
            </div>
          </div>
          <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
        </Link>
      </SectionCard>
    </main>
  );
}
