"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Download,
  FileText,
  GraduationCap,
  IdCard,
  Mail,
  Phone,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import {
  PEGAWAI_ARCHIVE_STORAGE_KEY,
  pegawaiArchives,
  type PegawaiArchive,
} from "@/app/arsip-pegawai/_data/pegawai-archive";
import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
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
import { cn } from "@/lib/utils";

export function ArsipPegawaiDetailClient({ id }: { id: string }) {
  const [pegawaiRecords, setPegawaiRecords] =
    useState<PegawaiArchive[]>(pegawaiArchives);

  useEffect(() => {
    queueMicrotask(() => {
      const storedRecords = window.localStorage.getItem(
        PEGAWAI_ARCHIVE_STORAGE_KEY,
      );

      if (!storedRecords) {
        return;
      }

      try {
        setPegawaiRecords(JSON.parse(storedRecords) as PegawaiArchive[]);
      } catch {
        window.localStorage.removeItem(PEGAWAI_ARCHIVE_STORAGE_KEY);
      }
    });
  }, []);

  const pegawai = useMemo(
    () => pegawaiRecords.find((record) => record.id === id) ?? null,
    [id, pegawaiRecords],
  );

  if (!pegawai) {
    return (
      <main className="space-y-6">
        <PageHero
          icon={IdCard}
          eyebrow="Detail ARSIPKU"
          title="Pegawai tidak ditemukan"
          description="Data pegawai belum tersedia atau sudah dihapus dari sistem arsip."
          aside={
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link href="/arsip-pegawai">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Link>
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <PageHero
        icon={IdCard}
        eyebrow="Detail ARSIPKU"
        title={pegawai.name}
        description="Biodata singkat dan arsip dokumen pegawai."
        meta={
          <Badge className="h-8 rounded-full bg-emerald-50 px-4 text-sm font-bold text-emerald-700">
            {pegawai.status}
          </Badge>
        }
        aside={
          <Button asChild variant="outline" className="h-11 rounded-xl">
            <Link href="/arsip-pegawai">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
          </Button>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <SectionCard
          title="Foto Pegawai"
          description="Identitas visual pegawai."
        >
          <div className="flex flex-col items-center text-center">
            <div
              className={cn(
                "flex aspect-[3/4] w-full max-w-[220px] items-center justify-center rounded-lg text-5xl font-extrabold ring-1 ring-current/10",
                pegawai.photoColor,
              )}
            >
              {getInitials(pegawai.name)}
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-pbd-navy">
              {pegawai.name}
            </h2>
            <p className="mt-1 text-sm font-semibold text-pbd-blue">
              {pegawai.position}
            </p>
            <p className="mt-2 text-sm text-slate-500">{pegawai.unit}</p>
          </div>
        </SectionCard>

        <SectionCard
          title="Biodata Singkat"
          description="Data utama pegawai untuk kebutuhan arsip internal."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <InfoItem label="NIP" value={pegawai.nip} icon={IdCard} />
            <InfoItem label="NIK" value={pegawai.nik} icon={ShieldCheck} />
            <InfoItem
              label="Pangkat/Golongan"
              value={pegawai.rank}
              icon={BadgeCheck}
            />
            <InfoItem
              label="No Rekening"
              value={pegawai.bankAccount}
              icon={IdCard}
            />
            <InfoItem label="Email" value={pegawai.email} icon={Mail} />
            <InfoItem label="Telepon" value={pegawai.phone} icon={Phone} />
            <InfoItem
              label="Alamat"
              value={pegawai.address}
              icon={FileText}
              className="md:col-span-2"
            />
          </div>
        </SectionCard>
      </section>

      <SectionCard
        title="Daftar File Arsip"
        description="File ijazah, SK, SPMT, sertifikat, dan dokumen pendukung lainnya."
        contentClassName="p-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama File</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Nomor Dokumen</TableHead>
              <TableHead>Tahun</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pegawai.documents.length > 0 ? (
              pegawai.documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell className="min-w-[260px] whitespace-normal">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue">
                        {document.category === "Ijazah" ? (
                          <GraduationCap className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-pbd-navy">
                          {document.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Upload {formatDate(document.uploadedAt)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50">
                      {document.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{document.number}</TableCell>
                  <TableCell>{document.year}</TableCell>
                  <TableCell>{document.fileType}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        document.status === "Lengkap"
                          ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                          : "border border-amber-100 bg-amber-50 text-amber-700"
                      }
                    >
                      {document.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm font-medium text-slate-500"
                >
                  Belum ada file arsip untuk pegawai ini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>
    </main>
  );
}

function InfoItem({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-slate-200 p-4", className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-pbd-blue">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
          <p className="mt-1 break-words font-semibold text-pbd-navy">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}
