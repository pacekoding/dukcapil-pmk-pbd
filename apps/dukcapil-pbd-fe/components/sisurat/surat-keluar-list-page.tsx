"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FilePlus2, Inbox, ListChecks } from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockSuratKeluar } from "@/lib/sisurat/mock-surat";
import type { SuratKeluar } from "@/types/surat";

import { DeleteSuratDialog } from "./delete-surat-dialog";
import {
  SuratKeluarFilters,
  type SuratKeluarFilterState,
} from "./surat-keluar-filters";
import { SuratKeluarTable } from "./surat-keluar-table";

const initialFilters: SuratKeluarFilterState = {
  year: "all",
  jenis: "all",
  status: "all",
  klasifikasi: "all",
  query: "",
};

export function SuratKeluarListPage() {
  const [surat, setSurat] = useState<SuratKeluar[]>(mockSuratKeluar);
  const [filters, setFilters] = useState(initialFilters);
  const [deleteTarget, setDeleteTarget] = useState<SuratKeluar>();
  const [templateMessage, setTemplateMessage] = useState("");

  const years = useMemo(
    () =>
      Array.from(
        new Set(surat.map((item) => item.tanggalPembuatan.slice(0, 4))),
      ).sort((a, b) => Number(b) - Number(a)),
    [surat],
  );

  const filteredSurat = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return surat.filter((item) => {
      const matchesYear =
        filters.year === "all" ||
        item.tanggalPembuatan.startsWith(filters.year);
      const matchesJenis =
        filters.jenis === "all" || item.jenisSurat === filters.jenis;
      const matchesStatus =
        filters.status === "all" || item.status === filters.status;
      const matchesKlasifikasi =
        filters.klasifikasi === "all" ||
        item.klasifikasi === filters.klasifikasi;
      const matchesQuery =
        !query ||
        [item.nomorSurat, item.perihal, item.tujuan]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return (
        matchesYear &&
        matchesJenis &&
        matchesStatus &&
        matchesKlasifikasi &&
        matchesQuery
      );
    });
  }, [filters, surat]);

  return (
    <main className="space-y-6">
      <PageHero
        icon={ListChecks}
        eyebrow="Daftar Surat Keluar"
        title="Pengelolaan Dokumen Surat Keluar"
        description="Cari, filter, edit, hapus, dan cetak surat keluar Bidang Dukcapil dari satu tabel kerja operator."
        meta={
          <Badge className="h-8 rounded-full bg-blue-50 px-4 text-sm font-bold text-pbd-blue">
            {surat.length} data mock
          </Badge>
        }
        aside={
          <Button
            asChild
            className="h-11 rounded-xl bg-pbd-navy text-white hover:bg-pbd-navy/90"
          >
            <Link href="/sisurat/generate">
              <FilePlus2 className="h-4 w-4" />
              Buat Surat Keluar
            </Link>
          </Button>
        }
      />

      <SectionCard
        title="Filter Surat Keluar"
        description="Gunakan filter untuk mempersempit data berdasarkan metadata surat."
      >
        <SuratKeluarFilters
          value={filters}
          years={years}
          onChange={setFilters}
        />
        {templateMessage ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {templateMessage}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Tabel Surat Keluar"
        description="Aksi cetak penuh tersedia untuk template Radiogram."
        contentClassName={filteredSurat.length ? "p-0" : "p-5"}
      >
        {filteredSurat.length ? (
          <SuratKeluarTable
            surat={filteredSurat}
            onDelete={setDeleteTarget}
            onPrintUnavailable={(item) =>
              setTemplateMessage(
                `Template surat ${item.nomorSurat} belum tersedia.`,
              )
            }
          />
        ) : (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <Inbox className="h-10 w-10 text-slate-400" />
            <h2 className="mt-4 text-lg font-bold text-pbd-navy">
              Belum ada surat keluar.
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Klik Buat Surat Keluar untuk membuat dokumen baru.
            </p>
            <Button asChild className="mt-5 bg-pbd-navy text-white">
              <Link href="/sisurat/generate">
                <FilePlus2 className="h-4 w-4" />
                Buat Surat Keluar
              </Link>
            </Button>
          </div>
        )}
      </SectionCard>

      <DeleteSuratDialog
        surat={deleteTarget}
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(undefined);
          }
        }}
        onConfirm={() => {
          if (deleteTarget) {
            setSurat((current) =>
              current.filter((item) => item.id !== deleteTarget.id),
            );
          }
          setDeleteTarget(undefined);
        }}
      />
    </main>
  );
}
