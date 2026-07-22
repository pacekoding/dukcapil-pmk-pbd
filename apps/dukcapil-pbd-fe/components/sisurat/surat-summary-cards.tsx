"use client";

import {
  ClipboardCheck,
  FileCheck2,
  FileClock,
  FileText,
  RadioTower,
  Send,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import type { SuratKeluar } from "@/types/surat";

export function SuratSummaryCards({ surat }: { surat: SuratKeluar[] }) {
  const radiogram = surat.filter((item) => item.jenisSurat === "radiogram");
  const undangan = surat.filter((item) => item.jenisSurat === "undangan");
  const draft = surat.filter((item) => item.status === "draft");
  const siapCetak = surat.filter((item) => item.status === "siap_cetak");
  const terkirim = surat.filter((item) => item.status === "terkirim");

  const stats = [
    {
      label: "Total Surat Keluar",
      value: String(surat.length),
      description: "Semua dokumen keluar",
      icon: FileText,
      tone: "blue" as const,
    },
    {
      label: "Radiogram",
      value: String(radiogram.length),
      description: "Prototype aktif",
      icon: RadioTower,
      tone: "indigo" as const,
    },
    {
      label: "Undangan",
      value: String(undangan.length),
      description: "Template segera tersedia",
      icon: ClipboardCheck,
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
      label: "Siap Cetak",
      value: String(siapCetak.length),
      description: "Menunggu cetak",
      icon: FileCheck2,
      tone: "blue" as const,
    },
    {
      label: "Terkirim",
      value: String(terkirim.length),
      description: "Sudah didistribusikan",
      icon: Send,
      tone: "emerald" as const,
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {stats.map((item) => (
        <StatCard key={item.label} {...item} />
      ))}
    </section>
  );
}
