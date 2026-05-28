// app/dashboard/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  FileText,
  type LucideIcon,
  Play,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { getDashboardOverview } from "@/lib/api/dashboard";
import type { DashboardIcon, DashboardOverview } from "@/types/dashboard";

const dashboardIconMap: Record<DashboardIcon, LucideIcon> = {
  calendar: Calendar,
  play: Play,
  checkCircle: CheckCircle2,
  fileText: FileText,
};

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);

        const data = await getDashboardOverview();

        if (mounted) {
          setOverview(data);
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
  const dashboardActivities = overview?.activities ?? [];

  return (
    <main className="space-y-6">
      {/* HEADER */}
      <section className="flex flex-col gap-4 rounded-xl border bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Dashboard</Badge>
            <Badge variant="secondary">
              TA {overview?.tahunAnggaran ?? "-"}
            </Badge>
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            Ringkasan Kegiatan
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitoring data kegiatan, dokumen, dan status pelaksanaan.
          </p>
        </div>

        <Button asChild className="w-full md:w-auto">
          <Link href="/dashboard/kegiatan">Kelola Kegiatan</Link>
        </Button>
      </section>

      {/* ERROR */}
      {error ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </section>
      ) : null}

      {/* STATS */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="border shadow-sm">
                <CardContent className="p-5">
                  <div className="h-20 animate-pulse rounded-lg bg-slate-100" />
                </CardContent>
              </Card>
            ))
          : dashboardStats.map((item, index) => {
              const Icon = dashboardIconMap[item.icon];

              return (
                <Card key={index} className="border shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          {item.title}
                        </p>

                        <h2 className="mt-2 text-3xl font-bold text-slate-900">
                          {item.value}
                        </h2>

                        {item.trend ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {item.trend}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </section>

      {/* RECENT ACTIVITIES */}
      <section className="rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Aktivitas Terbaru
            </h2>
            <p className="text-sm text-slate-500">
              Data terbaru berdasarkan API dashboard.
            </p>
          </div>

          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/kegiatan">Lihat Semua</Link>
          </Button>
        </div>

        <div className="divide-y">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="px-6 py-4">
                <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
              </div>
            ))
          ) : dashboardActivities.length > 0 ? (
            dashboardActivities.map((item, index) => {
              const Icon = dashboardIconMap[item.icon];

              return (
                <div
                  key={index}
                  className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </h3>

                      <p className="text-sm text-slate-500">{item.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 md:justify-end">
                    <Badge
                      variant={
                        item.status === "Selesai" ? "secondary" : "outline"
                      }
                    >
                      {item.status}
                    </Badge>

                    <span className="text-sm text-slate-500">{item.time}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-6 py-10 text-center text-sm text-slate-500">
              Belum ada aktivitas terbaru.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
