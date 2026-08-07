"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Database,
  ExternalLink,
  FileCheck2,
  Fingerprint,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getSiberDataWilayah,
  getSiberDataWilayahSettings,
} from "@/lib/api/data-wilayah";
import { formatNumber } from "@/lib/data-wilayah";
import type {
  DataWilayahAdminSettings,
  RegionData,
} from "@/types/data-wilayah";

type SessionPayload = {
  authenticated?: boolean;
  tahunAnggaran?: string;
};

export default function SiberDashboardPage() {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [settings, setSettings] = useState<DataWilayahAdminSettings | null>(null);
  const [tahunAnggaran, setTahunAnggaran] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const session = (await response.json().catch(() => null)) as
          | SessionPayload
          | null;

        if (!response.ok || !session?.authenticated || !session.tahunAnggaran) {
          throw new Error("Sesi atau tahun anggaran tidak tersedia.");
        }

        const [data, releaseSettings] = await Promise.all([
          getSiberDataWilayah(),
          getSiberDataWilayahSettings(),
        ]);

        if (!mounted) {
          return;
        }

        setRegions(data.regions);
        setSettings(releaseSettings);
        setTahunAnggaran(data.tahunAnggaran || session.tahunAnggaran);
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Dashboard SIRBE gagal dimuat.",
          );
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
  }, [reloadKey]);

  const totals = useMemo(() => {
    const totalPenduduk = regions.reduce(
      (total, region) => total + region.oap.jumlahJiwa,
      0,
    );
    const totalOap = regions.reduce(
      (total, region) => total + region.oap.jumlahOap,
      0,
    );
    const totalNonOap = regions.reduce(
      (total, region) => total + region.oap.jumlahNonOap,
      0,
    );
    const totalKtpEl = regions.reduce(
      (total, region) => total + region.registration.pencetakanKtpEl,
      0,
    );
    const totalDokumenSipil = regions.reduce(
      (total, region) =>
        total +
        region.civil.aktaKelahiran +
        region.civil.aktaKematian +
        region.civil.aktaPerkawinan +
        region.civil.aktaPerceraian,
      0,
    );

    return {
      totalPenduduk,
      totalOap,
      totalNonOap,
      totalKtpEl,
      totalDokumenSipil,
    };
  }, [regions]);

  const releaseLabel = settings
    ? settings.publishedTahunAnggaran.includes(tahunAnggaran)
      ? "Sudah dirilis ke website"
      : "Belum dirilis ke website"
    : "Status release belum tersedia";
  const publicDataWilayahHref = tahunAnggaran
    ? `/data-wilayah?period=${encodeURIComponent(tahunAnggaran)}&dataset=registration`
    : null;

  const dashboardStats = [
    {
      label: "Total Penduduk",
      value: loading ? "..." : formatNumber(totals.totalPenduduk),
      description: `${regions.length} kabupaten/kota tahun ${tahunAnggaran || "—"}`,
      icon: Users,
      tone: "blue" as const,
    },
    {
      label: "Penduduk OAP",
      value: loading ? "..." : formatNumber(totals.totalOap),
      description: "Akumulasi Orang Asli Papua",
      icon: ShieldCheck,
      tone: "emerald" as const,
    },
    {
      label: "Pencetakan KTP-el",
      value: loading ? "..." : formatNumber(totals.totalKtpEl),
      description: "Dokumen KTP elektronik tercetak",
      icon: Fingerprint,
      tone: "indigo" as const,
    },
    {
      label: "Dokumen Pencatatan Sipil",
      value: loading ? "..." : formatNumber(totals.totalDokumenSipil),
      description: "Kelahiran, kematian, perkawinan, dan perceraian",
      icon: FileCheck2,
      tone: "amber" as const,
    },
  ];

  return (
    <main className="space-y-6">
      <PageHero
        icon={Database}
        eyebrow="SIRBE"
        title="Dashboard Data Dukcapil"
        description="Pantau dan kelola data kependudukan, pencatatan sipil, serta data OAP yang ditampilkan pada halaman Data Wilayah."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
              Tahun {tahunAnggaran || "—"}
            </Badge>
            <Badge
              variant="outline"
              className="h-8 rounded-full bg-white px-4 text-sm font-bold text-slate-600"
            >
              {releaseLabel}
            </Badge>
          </div>
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
              <Link href="/siber/data">
                <Database className="h-4 w-4" />
                Kelola Data
              </Link>
            </Button>
          </div>
        }
      />

      {error ? (
        <section className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold">{error}</p>
          <Button
            type="button"
            variant="outline"
            className="border-red-200 bg-white text-red-700 hover:bg-red-100 hover:text-red-800"
            onClick={() => setReloadKey((current) => current + 1)}
          >
            <RefreshCw className="h-4 w-4" />
            Muat Ulang
          </Button>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </section>

      {!loading && !error && regions.length === 0 ? (
        <SectionCard>
          <div className="py-8 text-center">
            <Database className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-3 font-bold text-pbd-navy">
              Data wilayah belum tersedia
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Belum ada data Dukcapil untuk tahun anggaran {tahunAnggaran}.
            </p>
          </div>
        </SectionCard>
      ) : null}

      <section className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <PopulationCompositionChart
          totalOap={totals.totalOap}
          totalNonOap={totals.totalNonOap}
          tahunAnggaran={tahunAnggaran}
          loading={loading}
        />

        <SectionCard
          title="Menu SIRBE"
          description="Kelola data internal atau periksa hasilnya pada halaman publik Data Wilayah."
          className="h-full"
        >
          <div className="grid gap-4">
            <DashboardLink
              href="/siber/data"
              icon={Database}
              title="Kelola Data Dukcapil"
              description="Edit data per kabupaten/kota untuk pendaftaran penduduk, pencatatan sipil, dan OAP."
            />
            <DashboardLink
              href={publicDataWilayahHref}
              icon={ExternalLink}
              title="Lihat Data Wilayah"
              description="Buka halaman publik untuk memeriksa tampilan statistik yang sudah dirilis."
            />
          </div>
        </SectionCard>
      </section>
    </main>
  );
}

type PieSlice = {
  label: string;
  value: number;
  color: string;
  startAngle: number;
  endAngle: number;
  percentage: number;
};

function PopulationCompositionChart({
  totalOap,
  totalNonOap,
  tahunAnggaran,
  loading,
}: {
  totalOap: number;
  totalNonOap: number;
  tahunAnggaran: string;
  loading: boolean;
}) {
  const total = totalOap + totalNonOap;
  const values = [
    { label: "Penduduk OAP", value: totalOap, color: "#2563eb" },
    { label: "Penduduk Non-OAP", value: totalNonOap, color: "#94a3b8" },
  ];
  let currentAngle = -90;
  const slices: PieSlice[] = values.map((item) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0;
    const startAngle = currentAngle;
    const endAngle = startAngle + percentage * 3.6;
    currentAngle = endAngle;
    return { ...item, startAngle, endAngle, percentage };
  });

  return (
    <SectionCard
      title="Komposisi Penduduk (OAP vs. Non-OAP)"
      description={`Data OAP dan Non-OAP tahun ${tahunAnggaran || "—"}.`}
      className="h-full"
    >
      {loading ? (
        <div className="grid min-h-[280px] place-items-center">
          <div className="h-52 w-52 animate-pulse rounded-full bg-slate-100" />
        </div>
      ) : total > 0 ? (
        <>
          <div className="grid items-center gap-6 sm:grid-cols-[minmax(220px,1fr)_minmax(180px,0.8fr)]">
            <div className="mx-auto w-full max-w-[280px]">
              <svg
                viewBox="0 0 240 240"
                role="img"
                aria-label={`Komposisi penduduk: ${formatNumber(totalOap)} OAP dan ${formatNumber(totalNonOap)} Non-OAP`}
                className="h-auto w-full drop-shadow-sm"
              >
                <title>Komposisi Penduduk OAP dan Non-OAP</title>
                {slices.map((slice) => {
                  const fullCircle = slice.percentage >= 99.999;
                  const labelPoint = polarPoint(
                    120,
                    120,
                    68,
                    (slice.startAngle + slice.endAngle) / 2,
                  );

                  return (
                    <g key={slice.label}>
                      {fullCircle ? (
                        <circle
                          cx="120"
                          cy="120"
                          r="96"
                          fill={slice.color}
                          stroke="white"
                          strokeWidth="2"
                        />
                      ) : slice.percentage > 0 ? (
                        <path
                          d={pieSlicePath(
                            120,
                            120,
                            96,
                            slice.startAngle,
                            slice.endAngle,
                          )}
                          fill={slice.color}
                          stroke="white"
                          strokeWidth="2"
                        >
                          <title>
                            {slice.label}: {formatNumber(slice.value)} (
                            {formatPercentage(slice.percentage)})
                          </title>
                        </path>
                      ) : null}
                      {slice.percentage >= 7 ? (
                        <text
                          x={labelPoint.x}
                          y={labelPoint.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-white text-[13px] font-bold"
                        >
                          {formatPercentage(slice.percentage)}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Total Penduduk
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-pbd-navy">
                  {formatNumber(total)}
                </p>
              </div>
              <div className="space-y-3">
                {slices.map((slice) => (
                  <div key={slice.label} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1 h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: slice.color }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700">
                        {slice.label}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatNumber(slice.value)} ·{" "}
                        {formatPercentage(slice.percentage)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
            {slices.map((slice) => (
              <div key={slice.label} className="rounded-lg bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-500">
                  {slice.label}
                </p>
                <p className="mt-1 font-bold text-pbd-navy">
                  {formatNumber(slice.value)}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="grid min-h-[280px] place-items-center text-center">
          <div>
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-semibold text-pbd-navy">
              Data komposisi belum tersedia
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Isi data OAP dan Non-OAP untuk menampilkan pie chart.
            </p>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function polarPoint(
  centerX: number,
  centerY: number,
  radius: number,
  angle: number,
) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY + radius * Math.sin(radians),
  };
}

function pieSlicePath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarPoint(centerX, centerY, radius, startAngle);
  const end = polarPoint(centerX, centerY, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${centerX} ${centerY}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function formatPercentage(value: number) {
  return `${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

function DashboardLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string | null;
  icon: typeof Database;
  title: string;
  description: string;
}) {
  const content = (
    <>
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue ring-1 ring-blue-100">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-bold text-pbd-navy">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
      </div>
      <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
    </>
  );

  const className =
    "flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5 transition";

  if (!href) {
    return (
      <div aria-disabled="true" className={`${className} opacity-60`}>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`${className} hover:border-pbd-blue/30 hover:bg-blue-50`}
    >
      {content}
    </Link>
  );
}
