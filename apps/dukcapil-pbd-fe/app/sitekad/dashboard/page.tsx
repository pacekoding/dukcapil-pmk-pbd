"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Database,
  MapPinned,
  Sprout,
  Trophy,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSitekadPotensiKampung } from "@/lib/api/sitekad";
import type { SitekadPotensiKampung } from "@/types/sitekad";

const programTekadDescription =
  "Program Transformasi Ekonomi Kampung Terpadu (TEKAD) merupakan program kerja sama Kementerian Desa, Pembangunan Daerah Tertinggal dengan International Fund for Agricultural Development (IFAD) yang bertujuan memberdayakan masyarakat desa sehingga dapat berkontribusi pada transformasi perdesaan dan pertumbuhan inklusif di Indonesia Timur.";

export default function SitekadDashboardPage() {
  const [records, setRecords] = useState<SitekadPotensiKampung[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const data = await getSitekadPotensiKampung();
        if (mounted) {
          setRecords(data.items);
          setLoadError(false);
        }
      } catch (error) {
        console.error(error);
        if (mounted) {
          setLoadError(true);
        }
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
    const kabupaten = Array.from(
      new Set(records.map((record) => record.kabupatenKota).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b, "id"));
    const totalDana = records.reduce(
      (total, record) => total + record.danaAlokasi,
      0,
    );

    return [
      {
        label: "Total Kelompok",
        value: loading ? "..." : String(records.length),
        description: "Kelompok binaan aktif",
        icon: UsersRound,
        tone: "emerald" as const,
      },
      {
        label: "Total Dana Alokasi",
        value: loading ? "..." : formatCurrency(totalDana),
        description: "Dana yang dialokasikan",
        icon: WalletCards,
        tone: "blue" as const,
      },
      {
        label: "Kabupaten Lokus",
        value: loading ? "..." : String(kabupaten.length),
        description: kabupaten.length
          ? kabupaten.join(" & ")
          : "Belum ada lokasi terdata",
        icon: MapPinned,
        tone: "indigo" as const,
      },
    ];
  }, [loading, records]);

  return (
    <main className="space-y-6">
      <PageHero
        icon={Sprout}
        eyebrow="SITEKAD"
        title="Sistem Informasi Terpadu Program TEKAD"
        description="Pusat informasi dan pengelolaan data kelompok binaan pada lokus Program Transformasi Ekonomi Kampung Terpadu di Provinsi Papua Barat Daya."
        meta={
          <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
            {loading
              ? "Memuat data kelompok..."
              : loadError
                ? "Data kelompok belum tersedia"
                : `${records.length} kelompok binaan`}
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
                Buka Data Kelompok
              </Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Tentang Program TEKAD" className="h-full">
          <p className="text-sm leading-7 text-slate-600">
            {programTekadDescription}
          </p>
        </SectionCard>

        <SectionCard title="Tentang SITEKAD" className="h-full">
          <div className="space-y-3 text-sm leading-7 text-slate-600">
            <p>
              SITEKAD (Sistem Informasi Terpadu Program Transformasi Ekonomi
              Kampung Terpadu) dikembangkan sebagai penyediaan basis data
              terpadu untuk mendukung pengelolaan data perkembangan Program
              TEKAD pada Bidang Pemberdayaan Ekonomi Masyarakat di Dinas
              Kependudukan dan Pencatatan Sipil dan Pemberdayaan Masyarakat dan
              Kampung Provinsi Papua Barat Daya.
            </p>
            <p>
              Aplikasi ini menyediakan informasi kelompok binaan pada lokus
              Program TEKAD sebagai bahan pendukung monitoring dan evaluasi
              program.
            </p>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
        title="Pengelolaan Program TEKAD"
        description="Kelola identitas kelompok binaan serta riwayat capaian dan kendalanya."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Link
            href="/sitekad/data"
            className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5 transition hover:border-pbd-blue/30 hover:bg-blue-50"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue ring-1 ring-blue-100">
                <UsersRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-pbd-navy">Data Kelompok</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Tambah, cari, ubah, dan hapus identitas kelompok binaan.
                </p>
              </div>
            </div>
            <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
          </Link>

          <Link
            href="/sitekad/capaian-kendala"
            className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5 transition hover:border-emerald-300 hover:bg-emerald-50"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-pbd-navy">Capaian & Kendala</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Catat banyak riwayat capaian, kendala, dan dokumentasi per kelompok.
                </p>
              </div>
            </div>
            <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
          </Link>
        </div>
      </SectionCard>
    </main>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
