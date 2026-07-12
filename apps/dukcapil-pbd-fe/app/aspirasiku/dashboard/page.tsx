"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Inbox,
  MessageSquareText,
  Send,
} from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAspirasiMessages } from "@/lib/api/aspirasiku";
import type { Aspirasi } from "@/types/aspirasiku";

export default function AspirasikuDashboardPage() {
  const [records, setRecords] = useState<Aspirasi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const data = await getAspirasiMessages();
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

  const stats = useMemo(
    () => [
      {
        label: "Aspirasi Masuk",
        value: loading ? "..." : String(records.length),
        description: "Semua pesan anonim",
        icon: Inbox,
        tone: "blue" as const,
      },
      {
        label: "Belum Dibaca",
        value: loading
          ? "..."
          : String(records.filter((record) => record.status === "Baru").length),
        description: "Butuh tindak lanjut awal",
        icon: MessageSquareText,
        tone: "amber" as const,
      },
      {
        label: "Selesai",
        value: loading
          ? "..."
          : String(
              records.filter((record) => record.status === "Selesai").length,
            ),
        description: "Sudah ditangani",
        icon: CheckCircle2,
        tone: "emerald" as const,
      },
    ],
    [loading, records],
  );

  return (
    <main className="space-y-6">
      <PageHero
        icon={MessageSquareText}
        eyebrow="ASPIRASIKU"
        title="Sistem Aspirasi Anonim"
        description="Dashboard untuk menampung dan mengelola pesan aspirasi anonim dari halaman publik website Dinas Dukcapil dan PMK."
        meta={
          <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
            Link publik: /aspirasi
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
              <Link href="/aspirasiku/data">
                <Inbox className="h-4 w-4" />
                Buka Data
              </Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
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
        title="Menu ASPIRASIKU"
        description="Gunakan menu Data Aspirasi untuk membaca pesan masuk, mengubah status tindak lanjut, atau menghapus pesan yang tidak diperlukan."
      >
        <Link
          href="/aspirasiku/data"
          className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5 transition hover:border-pbd-blue/30 hover:bg-blue-50"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue ring-1 ring-blue-100">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-pbd-navy">Data Aspirasi</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Lihat aspirasi anonim yang dikirim dari link publik
                /aspirasi, lalu tandai status Baru, Dibaca, atau Selesai.
              </p>
            </div>
          </div>
          <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
        </Link>
      </SectionCard>
    </main>
  );
}
