"use client";

import Link from "next/link";
import { Download, Eye, PenLine, Printer, Trash2 } from "lucide-react";

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
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

type SuratKeluarTableProps = {
  surat: SuratKeluar[];
  onDelete: (surat: SuratKeluar) => void;
  onPrintUnavailable: (surat: SuratKeluar) => void;
};

export function SuratKeluarTable({
  surat,
  onDelete,
  onPrintUnavailable,
}: SuratKeluarTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>No</TableHead>
          <TableHead>Nomor Surat</TableHead>
          <TableHead>Jenis Surat</TableHead>
          <TableHead>Tujuan</TableHead>
          <TableHead>Perihal/Ringkasan</TableHead>
          <TableHead>Tanggal</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Dibuat Oleh</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {surat.map((item, index) => (
          <TableRow key={item.id}>
            <TableCell className="font-semibold text-slate-500">
              {index + 1}
            </TableCell>
            <TableCell className="font-bold text-pbd-navy">
              {item.nomorSurat || "Draft tanpa nomor"}
            </TableCell>
            <TableCell>{jenisSuratLabels[item.jenisSurat]}</TableCell>
            <TableCell className="max-w-[240px] whitespace-normal leading-5">
              {item.tujuan}
            </TableCell>
            <TableCell className="max-w-[260px] whitespace-normal leading-5">
              {item.perihal}
            </TableCell>
            <TableCell>{formatDate(item.tanggalPembuatan)}</TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <StatusSuratBadge status={item.status} />
                <KlasifikasiBadge klasifikasi={item.klasifikasi} />
              </div>
            </TableCell>
            <TableCell>{item.dibuatOleh ?? "Operator SISURAT"}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <Button asChild size="icon-sm" variant="ghost" title="Lihat">
                  <Link href={`/sisurat/surat-keluar/${item.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="icon-sm" variant="ghost" title="Edit">
                  <Link href={`/sisurat/surat-keluar/${item.id}/edit`}>
                    <PenLine className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  title="Hapus"
                  onClick={() => onDelete(item)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
                {item.jenisSurat === "radiogram" ? (
                  <>
                    <Button
                      asChild
                      size="icon-sm"
                      variant="ghost"
                      title="Preview"
                    >
                      <Link href={`/sisurat/surat-keluar/${item.id}`}>
                        <Printer className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="icon-sm"
                      variant="ghost"
                      title="Download PDF"
                    >
                      <Link href={`/sisurat/surat-keluar/${item.id}`}>
                        <Download className="h-4 w-4" />
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    title="Cetak"
                    onClick={() => onPrintUnavailable(item)}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
