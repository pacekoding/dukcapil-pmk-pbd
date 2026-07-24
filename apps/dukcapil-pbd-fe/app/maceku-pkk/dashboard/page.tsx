"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Archive,
  Building2,
  FolderOpen,
  UsersRound,
} from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMacekuPKKProfiles } from "@/lib/api/maceku-pkk";
import type { MacekuPKKProfileSummary } from "@/types/maceku-pkk";

export default function MacekuPkkDashboardPage() {
  const [items, setItems] = useState<MacekuPKKProfileSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await getMacekuPKKProfiles({ page: 1, limit: 100 });
        if (mounted) {
          setItems(response.items);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const activeCount = items.filter((item) => item.isActive).length;
    const documentCount = items.reduce((total, item) => total + item.documentCount, 0);
    const kabupatenCount = new Set(items.map((item) => item.kabupatenKota)).size;

    return [
      {
        label: "Profil PKK",
        value: loading ? "..." : `${items.length}`,
        description: "Organisasi PKK terdaftar",
        icon: UsersRound,
        tone: "slate" as const,
      },
      {
        label: "Profil Aktif",
        value: loading ? "..." : `${activeCount}`,
        description: "Status aktif saat ini",
        icon: Building2,
        tone: "emerald" as const,
      },
      {
        label: "Total Arsip",
        value: loading ? "..." : `${documentCount}`,
        description: "Dokumen organisasi tersimpan",
        icon: Archive,
        tone: "indigo" as const,
      },
      {
        label: "Kab/Kota",
        value: loading ? "..." : `${kabupatenCount}`,
        description: "Sebaran wilayah PKK",
        icon: FolderOpen,
        tone: "blue" as const,
      },
    ];
  }, [items, loading]);

  return (
    <main className="space-y-6">
      <PageHero
        icon={UsersRound}
        eyebrow="MACEKU PKK"
        title="Manajemen Organisasi PKK"
        description="Kelola profil organisasi PKK dari tingkat kabupaten/kota, kecamatan/distrik, hingga desa/kampung beserta arsip dokumennya."
        meta={
          <Badge className="h-8 rounded-full bg-teal-50 px-4 text-sm font-bold text-teal-700">
            {items.length} profil PKK
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
              <Link href="/maceku-pkk/data">
                <FolderOpen className="h-4 w-4" />
                Buka Data PKK
              </Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
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
        title="Alur Kerja"
        description="Buat profil PKK lebih dulu, lalu buka detail profil untuk mengelola arsip program kerja, LKPJ, surat keputusan, dan dokumen organisasi lainnya."
      >
        <Link
          href="/maceku-pkk/data"
          className="flex items-start justify-between gap-4 rounded-lg border border-teal-100 bg-teal-50/70 p-5 transition hover:border-teal-200 hover:bg-teal-50"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700 ring-1 ring-teal-100">
              <UsersRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-pbd-navy">Daftar Profil PKK</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Cari, filter, tambah, ubah, dan buka detail profil PKK sesuai
                wilayah kerja yang diizinkan.
              </p>
            </div>
          </div>
          <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
        </Link>
      </SectionCard>
    </main>
  );
}
