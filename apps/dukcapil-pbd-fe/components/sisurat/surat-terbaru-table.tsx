"use client";

import Link from "next/link";
import { Eye, PenLine, Printer } from "lucide-react";

import { SectionCard } from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { jenisSuratLabels } from "@/lib/sisurat/mock-surat";
import type { SuratKeluar } from "@/types/surat";

import { KlasifikasiBadge } from "./klasifikasi-badge";
import { StatusSuratBadge } from "./status-surat-badge";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function SuratTerbaruTable({ surat }: { surat: SuratKeluar[] }) {
  const latest = [...surat]
    .sort(
      (a, b) =>
        new Date(b.tanggalPembuatan).getTime() -
        new Date(a.tanggalPembuatan).getTime(),
    )
    .slice(0, 5);

  return (
    <SectionCard
      title="Surat Terbaru"
      description="Dokumen surat keluar terakhir yang dibuat oleh operator."
      action={
        <Button asChild variant="outline">
          <Link href="/sisurat/surat-keluar">Lihat Daftar</Link>
        </Button>
      }
      contentClassName="p-0"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nomor Surat</TableHead>
            <TableHead>Jenis Surat</TableHead>
            <TableHead>Tujuan</TableHead>
            <TableHead>Klasifikasi</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {latest.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-bold text-pbd-navy">
                {item.nomorSurat || "Draft tanpa nomor"}
              </TableCell>
              <TableCell>{jenisSuratLabels[item.jenisSurat]}</TableCell>
              <TableCell className="max-w-[260px] whitespace-normal leading-5">
                {item.tujuan}
              </TableCell>
              <TableCell>
                <KlasifikasiBadge klasifikasi={item.klasifikasi} />
              </TableCell>
              <TableCell>
                <StatusSuratBadge status={item.status} />
              </TableCell>
              <TableCell>{formatDate(item.tanggalPembuatan)}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button asChild size="icon-sm" variant="ghost" title="Detail">
                    <Link href={`/sisurat/surat-keluar/${item.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="icon-sm" variant="ghost" title="Edit">
                    <Link href={`/sisurat/surat-keluar/${item.id}/edit`}>
                      <PenLine className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="icon-sm" variant="ghost" title="Cetak">
                    <Link href={`/sisurat/surat-keluar/${item.id}`}>
                      <Printer className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
