"use client";

import {
  FileCheck2,
  FileClock,
  FileText,
  CalendarDays,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import type { SuratKeluar } from "@/types/surat";

export function SuratSummaryCards({ surat }: { surat: SuratKeluar[] }) {
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const currentYearMonth = `${now.getFullYear()}-${currentMonth}`;
  const bulanIni = surat.filter((item) =>
    item.tanggalPembuatan.startsWith(currentYearMonth),
  );
  const draft = surat.filter((item) => item.status === "draft");
  const selesai = surat.filter((item) => item.status === "selesai");

  const stats = [
    {
      label: "Total Surat Keluar",
      value: String(surat.length),
      description: "Semua dokumen keluar",
      icon: FileText,
      tone: "blue" as const,
    },
    {
      label: "Surat Keluar Bulan Ini",
      value: String(bulanIni.length),
      description: "Berdasarkan tanggal pembuatan",
      icon: CalendarDays,
      tone: "emerald" as const,
    },
    {
      label: "Draft",
      value: String(draft.length),
      description: "Belum final",
      icon: FileClock,
      tone: "slate" as const,
    },
    {
      label: "Surat Selesai",
      value: String(selesai.length),
      description: "Sudah final",
      icon: FileCheck2,
      tone: "blue" as const,
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => (
        <StatCard key={item.label} {...item} />
      ))}
    </section>
  );
}
