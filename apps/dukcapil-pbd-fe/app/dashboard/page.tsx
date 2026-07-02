"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Building2,
  ClipboardList,
  Database,
  FileText,
  IdCard,
  Image,
  LayoutDashboard,
  ListChecks,
  MapPinned,
  type LucideIcon,
  UserRound,
  Users,
} from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { EmptyState, ErrorState, LoadingState } from "@/components/dashboard/state";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { getDashboardOverview } from "@/lib/api/dashboard";
import { cn } from "@/lib/utils";
import type { DashboardIcon, DashboardOverview } from "@/types/dashboard";

const dashboardIconMap: Record<DashboardIcon, LucideIcon> = {
  users: Users,
  userRound: UserRound,
  idCard: IdCard,
  building2: Building2,
  database: Database,
  listChecks: ListChecks,
  clipboardList: ClipboardList,
  image: Image,
  fileText: FileText,
};

const quickLinks = [
  {
    title: "Data Wilayah",
    href: "/dashboard/data-wilayah",
    description: "Perbarui statistik kabupaten/kota dan indikator layanan.",
    icon: MapPinned,
  },
  {
    title: "Subkegiatan",
    href: "/dashboard/subkegiatan",
    description: "Kelola master subkegiatan berdasarkan tahun anggaran.",
    icon: ListChecks,
  },
  {
    title: "Realisasi Subkegiatan",
    href: "/dashboard/realisasi-subkegiatan",
    description: "Pantau realisasi, foto dokumentasi, dan dokumen pendukung.",
    icon: ClipboardList,
  },
];

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        const data = await getDashboardOverview();
        if (mounted) {
          setOverview(data);
          setError("");
        }
      } catch (err) {
        console.error(err);
        if (mounted) {
          setError("Data dashboard gagal dimuat.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const dashboardStats = overview?.stats ?? [];
  const recentActivities = overview?.activities ?? [];

  return (
    <main className="space-y-6">
      <PageHero
        icon={LayoutDashboard}
        eyebrow="Dashboard"
        title="Summary Informasi Penting"
        description="Gambaran cepat tentang data wilayah, subkegiatan, realisasi, dan kelengkapan dokumentasi pada tahun anggaran aktif."
        meta={
          <p className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-pbd-blue">
            Tahun Anggaran {overview?.tahunAnggaran ?? "-"}
          </p>
        }
        aside={
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link href="/dashboard/subkegiatan">Kelola Subkegiatan</Link>
            </Button>
            <Button
              asChild
              className="h-11 rounded-xl bg-pbd-navy text-white hover:bg-pbd-navy/90"
            >
              <Link href="/dashboard/realisasi-subkegiatan">
                Buka Realisasi
              </Link>
            </Button>
          </div>
        }
      />

      {error ? <ErrorState message={error} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-lg border border-slate-200 bg-white"
              />
            ))
          : dashboardStats.map((item) => {
              const Icon = dashboardIconMap[item.icon];

              return (
                <StatCard
                  key={item.title}
                  label={item.title}
                  value={item.value}
                  description={item.description}
                  icon={Icon}
                  tone="blue"
                />
              );
            })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Realisasi Terbaru"
          description="Aktivitas realisasi terbaru pada tahun anggaran aktif."
          contentClassName="p-4"
        >
            {loading ? (
              <LoadingState rows={4} />
            ) : recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity) => {
                  const Icon = dashboardIconMap[activity.icon];
                  return (
                    <div
                      key={`${activity.title}-${activity.time}`}
                      className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                            activity.color,
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-pbd-navy">
                              {activity.title}
                            </h3>
                            <Badge variant="outline">{activity.status}</Badge>
                          </div>
                          <p className="mt-1 text-sm font-medium text-slate-600">
                            {activity.description}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span>{activity.location}</span>
                            <span>{activity.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="Belum ada realisasi subkegiatan" />
            )}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title="Akses Cepat"
            description="Modul utama yang paling sering dipakai untuk pengelolaan data."
          >
            <div className="space-y-3">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-start gap-4 rounded-lg border border-slate-200 p-4 transition hover:border-pbd-blue/30 hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-pbd-navy">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Fokus Tahun Ini">
            <div className="space-y-3 text-sm text-slate-600">
              <p className="rounded-md bg-slate-50 px-4 py-3">
                Pastikan data wilayah tetap sinkron dengan publikasi website.
              </p>
              <p className="rounded-md bg-slate-50 px-4 py-3">
                Lengkapi dokumentasi realisasi agar foto dan dokumen pendukung
                tercatat pada setiap kegiatan.
              </p>
              <p className="rounded-md bg-slate-50 px-4 py-3">
                Jaga konsistensi master subkegiatan supaya pelaporan realisasi
                tetap rapi per tahun anggaran.
              </p>
            </div>
          </SectionCard>
        </div>
      </section>
    </main>
  );
}
