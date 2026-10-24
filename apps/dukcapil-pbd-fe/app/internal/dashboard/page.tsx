"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  Database,
  FileText,
  FolderArchive,
  Home,
  IdCard,
  ListChecks,
  MapPinned,
  RefreshCw,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDashboardDataWilayah } from "@/lib/api/data-wilayah";
import { canAccessInternalHref } from "@/lib/internal-access";
import {
  formatNumber,
  getTotalBumdes,
  getTotalIdmVillages,
  getProvinceTotals,
} from "@/lib/data-wilayah";
import type { RegionData } from "@/types/data-wilayah";

type DashboardSessionUser = {
  role: string;
};

const quickLinks = [
  {
    title: "Pendaftaran Penduduk",
    description: "Kelola layanan KK, KIA, KTP-el, dan perpindahan penduduk.",
    href: "/internal/dukcapil/pendaftaran-penduduk",
    icon: Database,
  },
  {
    title: "Pencatatan Sipil",
    description: "Kelola akta dan peristiwa penting per kabupaten/kota.",
    href: "/internal/dukcapil/pencatatan-sipil",
    icon: FileText,
  },
  {
    title: "BUM Kampung",
    description: "Kelola badan usaha milik kampung dan status verifikasinya.",
    href: "/internal/pmk/bum-kampung",
    icon: Building2,
  },
  {
    title: "Data Kampung",
    description: "Kelola indeks dan status kemajuan kampung.",
    href: "/internal/pmk/data-kampung",
    icon: MapPinned,
  },
  {
    title: "Potensi Kampung",
    description: "Kelola kelompok binaan dan potensi Program TEKAD.",
    href: "/internal/pmk/kelompok-binaan",
    icon: ListChecks,
  },
  {
    title: "Pegawai dan Arsip",
    description: "Kelola biodata pegawai serta dokumen kepegawaiannya.",
    href: "/internal/pegawai",
    icon: IdCard,
  },
  {
    title: "Pengguna Portal",
    description: "Atur akun, role, status, dan password pengguna.",
    href: "/internal/pengaturan/pengguna",
    icon: UserCog,
    roles: ["superadmin"],
  },
  {
    title: "Arsip",
    description: "Cari seluruh dokumen kepegawaian dari satu tempat.",
    href: "/internal/arsip",
    icon: FolderArchive,
  },
];

export default function InternalDashboardPage() {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [tahunAnggaran, setTahunAnggaran] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [sessionUser, setSessionUser] = useState<DashboardSessionUser | null>(
    null,
  );
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getDashboardDataWilayah();

        if (!mounted) {
          return;
        }

        setRegions(data.regions);
        setTahunAnggaran(data.tahunAnggaran);
      } catch (loadError) {
        console.error(loadError);

        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Data agregat dashboard gagal dimuat.",
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

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const result = (await response.json()) as {
          user?: DashboardSessionUser;
        };

        if (mounted && result.user) {
          setSessionUser({
            role: result.user.role,
          });
        }
      } catch (sessionError) {
        console.error(sessionError);
      } finally {
        if (mounted) setSessionLoading(false);
      }
    };

    void loadSession();
    return () => {
      mounted = false;
    };
  }, []);

  const totals = useMemo(() => getProvinceTotals(regions), [regions]);
  const displayValue = (value: number) =>
    error ? "—" : formatNumber(value);

  const accessibleQuickLinks = useMemo(() => {
    if (!sessionUser) return [];

    return quickLinks.filter(
      (link) =>
        (!link.roles || link.roles.includes(sessionUser.role)) &&
        canAccessInternalHref(link.href, sessionUser.role),
    );
  }, [sessionUser]);

  const stats = [
    {
      label: "Total Penduduk",
      value: displayValue(totals.totalJiwa),
      description: "Total penduduk Provinsi Papua Barat Daya",
      icon: Users,
      tone: "blue" as const,
    },
    {
      label: "Penduduk OAP",
      value: displayValue(totals.totalOap),
      description: "Jumlah penduduk Orang Asli Papua",
      icon: ShieldCheck,
      tone: "emerald" as const,
    },
    {
      label: "Desa/Kampung IDM",
      value: displayValue(totals.totalDesaIdm),
      description: "Jumlah desa/kampung yang memiliki klasifikasi IDM",
      icon: Home,
      tone: "indigo" as const,
    },
    {
      label: "BUMDes/BUMKam",
      value: displayValue(totals.totalBumdes),
      description: "Jumlah badan usaha milik desa/kampung",
      icon: Building2,
      tone: "amber" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHero
        icon={Database}
        eyebrow="Data Agregat Prioritas"
        title="Dashboard"
        description="Ringkasan indikator prioritas Dinas Dukcapil dan PMK Provinsi Papua Barat Daya."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
              Tahun {tahunAnggaran || "—"}
            </Badge>
            <Badge
              variant="outline"
              className="h-8 rounded-full bg-white px-4 text-sm font-bold text-slate-600"
            >
              {regions.length} kabupaten/kota
            </Badge>
          </div>
        }
      />

      {error ? (
        <section className="app-surface flex flex-col gap-4 rounded-lg border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-red-800">
              Data agregat gagal dimuat
            </h2>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setReloadKey((current) => current + 1)}
            className="border-red-200 bg-white text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4" />
            Muat ulang
          </Button>
        </section>
      ) : null}

      <section
        aria-label="Ringkasan data agregat prioritas"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} loading={loading} />
        ))}
      </section>

      <SectionCard
        title="Akses Cepat"
        description="Buka modul yang paling sering digunakan sesuai hak akses akun Anda."
      >
        {sessionLoading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-lg border border-slate-100 bg-slate-100/80"
              />
            ))}
          </div>
        ) : accessibleQuickLinks.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {accessibleQuickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex min-h-28 items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-pbd-blue/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pbd-blue/30"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue ring-1 ring-blue-100">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2 font-bold text-pbd-navy">
                      {link.title}
                      <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-pbd-blue" />
                    </span>
                    <span className="mt-1.5 block text-sm leading-5 text-slate-500">
                      {link.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">
            Belum ada modul tambahan yang dapat diakses oleh akun ini.
          </p>
        )}
      </SectionCard>

      <SectionCard
        title="Ringkasan per Kabupaten/Kota"
        description={`Perbandingan indikator utama tahun ${tahunAnggaran || "aktif"}. Geser tabel pada layar kecil.`}
        contentClassName="p-0"
      >
        <Table className="min-w-[980px]">
          <TableHeader>
            <TableRow>
              <TableHead>Wilayah</TableHead>
              <TableHead className="text-right">Penduduk</TableHead>
              <TableHead className="text-right">OAP</TableHead>
              <TableHead className="text-right">Non-OAP</TableHead>
              <TableHead className="text-right">KTP-el Dicetak</TableHead>
              <TableHead className="text-right">Kampung IDM</TableHead>
              <TableHead className="text-right">BUM Kampung</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody aria-busy={loading}>
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 7 }).map((__, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <div className="h-5 animate-pulse rounded bg-slate-100" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : regions.length > 0 ? (
              regions.map((region) => (
                <TableRow key={region.id}>
                  <TableCell className="font-bold text-pbd-navy">
                    {region.name}
                  </TableCell>
                  <NumberCell value={region.oap.jumlahJiwa} />
                  <NumberCell value={region.oap.jumlahOap} />
                  <NumberCell value={region.oap.jumlahNonOap} />
                  <NumberCell value={region.registration.pencetakanKtpEl} />
                  <NumberCell value={getTotalIdmVillages(region.idm)} />
                  <NumberCell value={getTotalBumdes(region.bumdes)} />
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-500">
                  Data wilayah belum tersedia untuk tahun anggaran ini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}

function NumberCell({ value }: { value: number }) {
  return (
    <TableCell className="text-right font-semibold tabular-nums text-slate-700">
      {formatNumber(value)}
    </TableCell>
  );
}
