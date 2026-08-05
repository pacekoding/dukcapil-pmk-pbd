"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  FileCheck2,
  FolderArchive,
  IdCard,
  UsersRound,
} from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { ErrorState } from "@/components/dashboard/state";
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
import { getArsipPegawai } from "@/lib/api/arsipku";
import type { PegawaiArchive } from "@/types/arsipku";

export default function ArsipkuDashboardPage() {
  const [employees, setEmployees] = useState<PegawaiArchive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      try {
        const records = await getArsipPegawai();
        if (mounted) {
          setEmployees(Array.isArray(records) ? records : []);
          setError(null);
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setEmployees([]);
          setError("Dashboard ARSIPKU gagal dimuat.");
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

  const totalDocuments = employees.reduce(
    (total, employee) => total + employee.documents.length,
    0,
  );
  const activeEmployees = employees.filter(
    (employee) => employee.status === "Aktif",
  ).length;
  const needsVerification = employees.reduce(
    (total, employee) =>
      total +
      employee.documents.filter(
        (document) => document.status === "Perlu Verifikasi",
      ).length,
    0,
  );
  const recentDocuments = useMemo(
    () =>
      employees
        .flatMap((employee) =>
          employee.documents.map((document) => ({ employee, document })),
        )
        .sort(
          (left, right) =>
            new Date(right.document.uploadedAt).getTime() -
            new Date(left.document.uploadedAt).getTime(),
        )
        .slice(0, 5),
    [employees],
  );

  return (
    <main className="space-y-6">
      <PageHero
        icon={FolderArchive}
        eyebrow="Sistem ARSIPKU"
        title="Dashboard ARSIPKU"
        description="Ringkasan data pegawai dan dokumen arsip kepegawaian."
        aside={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link href="/arsipku/data-arsip">
                <FolderArchive className="h-4 w-4" />
                Data Arsip
              </Link>
            </Button>
            <Button
              asChild
              className="h-11 rounded-xl bg-pbd-navy text-white hover:bg-pbd-navy/90"
            >
              <Link href="/arsipku/data-pegawai">
                <UsersRound className="h-4 w-4" />
                Data Pegawai
              </Link>
            </Button>
          </div>
        }
      />

      {error ? <ErrorState message={error} /> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Pegawai"
          value={loading ? "..." : String(employees.length)}
          description="Pegawai terdaftar"
          icon={UsersRound}
          tone="blue"
        />
        <StatCard
          label="Pegawai Aktif"
          value={loading ? "..." : String(activeEmployees)}
          description="Status aktif"
          icon={IdCard}
          tone="emerald"
        />
        <StatCard
          label="Total Arsip"
          value={loading ? "..." : String(totalDocuments)}
          description="Dokumen tersimpan"
          icon={FileCheck2}
          tone="indigo"
        />
        <StatCard
          label="Perlu Verifikasi"
          value={loading ? "..." : String(needsVerification)}
          description="Dokumen menunggu pemeriksaan"
          icon={FolderArchive}
          tone="amber"
        />
      </section>

      <SectionCard
        title="Dokumen Terbaru"
        description="Lima dokumen arsip yang terakhir diunggah."
        action={
          <Button asChild type="button" variant="outline">
            <Link href="/arsipku/data-arsip">
              Lihat Semua
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
        contentClassName="p-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Dokumen</TableHead>
              <TableHead>Pegawai</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Tahun</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-sm text-slate-500"
                >
                  Memuat ringkasan ARSIPKU...
                </TableCell>
              </TableRow>
            ) : recentDocuments.length > 0 ? (
              recentDocuments.map(({ employee, document }) => (
                <TableRow key={`${employee.id}-${document.id}`}>
                  <TableCell className="font-bold text-pbd-navy">
                    <Link href={`/arsipku/data-pegawai/${employee.id}`}>
                      {document.title}
                    </Link>
                  </TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{document.category}</Badge>
                  </TableCell>
                  <TableCell>{document.year || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        document.status === "Lengkap"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }
                    >
                      {document.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-sm text-slate-500"
                >
                  Belum ada dokumen arsip pegawai.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>
    </main>
  );
}
