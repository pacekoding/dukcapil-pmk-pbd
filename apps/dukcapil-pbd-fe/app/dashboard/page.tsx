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
  TrendingUp,
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

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        const data = await getDashboardOverview();

        if (mounted) {
          setOverview(data);
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError("Data dashboard gagal dimuat.");
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
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <Badge className="rounded-xl">Dashboard Provinsi</Badge>

          <Badge
            variant="outline"
            className="rounded-xl border-blue-200 bg-blue-50 text-blue-700"
          >
            TA {overview?.tahunAnggaran ?? "-"}
          </Badge>
        </div>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
          Dashboard Monitoring Dukcapil & PMK Provinsi
        </h1>

        <p className="mt-3 max-w-3xl text-slate-500">
          Platform monitoring, fasilitasi, supervisi, dan evaluasi program
          administrasi kependudukan serta pemberdayaan masyarakat pada
          kabupaten/kota dan kampung/desa di tingkat provinsi.
        </p>

        <div className="mt-5 max-w-4xl rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-slate-700">
          Pemerintah Provinsi berperan dalam pembinaan, koordinasi, fasilitasi,
          supervisi, monitoring, dan evaluasi pelaksanaan urusan administrasi
          kependudukan serta pemberdayaan masyarakat. Fokus dashboard ini bukan
          pelayanan langsung kepada masyarakat, tetapi penguatan kabupaten/kota,
          intervensi kampung, pembinaan perangkat kampung, monitoring hibah, dan
          sinkronisasi kebijakan pusat-daerah.
        </div>
      </section>

      {error ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
          {error}
        </section>
      ) : null}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {overview
          ? dashboardStats.map((item, index) => {
              const Icon = dashboardIconMap[item.icon];

              return (
                <Card key={index} className="border border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-slate-500">{item.title}</p>

                        <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                          {item.value}
                        </h2>

                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                          <TrendingUp className="h-3 w-3" />
                          {item.trend}
                        </div>
                      </div>

                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.color}`}
                      >
                        <Icon className="h-7 w-7" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          : Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="border border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
                </CardContent>
              </Card>
            ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Dukcapil Provinsi
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Pembinaan dan supervisi administrasi kependudukan pada
              kabupaten/kota, fasilitasi implementasi layanan adminduk,
              monitoring kualitas data kependudukan, serta evaluasi pemanfaatan
              data kependudukan untuk perencanaan pembangunan daerah.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-slate-900">PMK Provinsi</h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Fasilitasi pemberdayaan masyarakat dan kampung/desa, pembinaan
              kelembagaan kampung, penguatan kapasitas perangkat kampung,
              monitoring intervensi program, evaluasi perkembangan kampung,
              serta pengawasan hibah dan bantuan sesuai kewenangan provinsi.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Aktivitas Fasilitasi & Supervisi Terbaru
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Monitoring kegiatan pembinaan, supervisi kabupaten/kota,
              intervensi kampung, perangkat kampung, dan hibah.
            </p>
          </div>

          <Button asChild variant="outline" className="rounded-2xl">
            <Link href="/dashboard/kegiatan">Lihat Semua</Link>
          </Button>
        </div>

        <div className="divide-y">
          {overview ? (
            dashboardActivities.map((item, index) => {
              const Icon = dashboardIconMap[item.icon];

              return (
                <div
                  key={index}
                  className="flex items-center justify-between px-8 py-6"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.color}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {item.location}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge
                      className={
                        item.status === "Selesai"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                      }
                    >
                      {item.status}
                    </Badge>

                    <p className="mt-2 text-sm text-slate-500">{item.time}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-8 py-6">
              <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
