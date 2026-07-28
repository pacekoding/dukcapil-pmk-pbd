"use client";

import Link from "next/link";
import { ArrowLeft, ClipboardList, FilePlus2, ListChecks } from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSuratKeluarStore } from "@/lib/sisurat/surat-store";

import { SuratSummaryCards } from "./surat-summary-cards";
import { SuratTerbaruTable } from "./surat-terbaru-table";

export function SuratDashboardPage() {
  const surat = useSuratKeluarStore();

  return (
    <main className="space-y-6">
      <PageHero
        icon={ClipboardList}
        eyebrow="SISURAT DUKCAPIL"
        title="Sistem Informasi Surat Keluar Bidang Dukcapil"
        description="Dashboard operator untuk melihat ringkasan, membuat, mengelola, mempreview, dan mencetak surat keluar Radiogram."
        meta={
          <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
            Prototype Radiogram Aktif
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
              <Link href="/sisurat/surat-keluar/create">
                <FilePlus2 className="h-4 w-4" />
                Buat Surat Keluar
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link href="/sisurat/surat-keluar">
                <ListChecks className="h-4 w-4" />
                Lihat Daftar Surat
              </Link>
            </Button>
          </div>
        }
      />

      <SuratSummaryCards surat={surat} />
      <SuratTerbaruTable surat={surat} />
    </main>
  );
}
