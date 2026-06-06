"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  FileSpreadsheet,
  MoreHorizontal,
  ToggleLeft,
  ToggleRight,
  Upload,
  X,
} from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { Pagination } from "@/components/dashboard/pagination";
import { SearchInput } from "@/components/dashboard/search-input";
import { SectionCard } from "@/components/dashboard/section-card";
import { EmptyState, ErrorState, SuccessState } from "@/components/dashboard/state";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSSD, importSSD, setSSDStatus } from "@/lib/api/ssd";
import type { SSD } from "@/types/ssd";

const PAGE_SIZE = 12;

export default function DashboardSSDPage() {
  const [items, setItems] = useState<SSD[]>([]);
  const [tahunAnggaran, setTahunAnggaran] = useState("2026");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const data = await getSSD();
        if (mounted) {
          setItems(data.items);
          setTahunAnggaran(data.tahunAnggaran);
          setError(null);
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError("Data SSD gagal dimuat.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      if (!normalizedQuery) {
        return true;
      }
      return (
        item.kode.toLowerCase().includes(normalizedQuery) ||
        item.uraian.toLowerCase().includes(normalizedQuery) ||
        item.satuan.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [items, query]);

  const paginatedItems = useMemo(
    () => filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredItems, page],
  );

  const activeCount = useMemo(
    () => items.filter((item) => item.isActive).length,
    [items],
  );

  const totalIndicators = useMemo(
    () => items.reduce((sum, item) => sum + item.jumlahIndikator, 0),
    [items],
  );

  const handleImport = async () => {
    if (!selectedFile) {
      setError("Pilih file XLSX terlebih dahulu.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const result = await importSSD(selectedFile);
      const refreshed = await getSSD();
      setItems(refreshed.items);
      setTahunAnggaran(refreshed.tahunAnggaran);
      setImportOpen(false);
      setSelectedFile(null);
      setMessage(
        `Import SSD selesai. ${result.created} data baru dan ${result.updated} data diperbarui.`,
      );
    } catch (importError) {
      console.error(importError);
      setError("Import SSD gagal diproses.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: SSD) => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await setSSDStatus(item.id, !item.isActive);
      setItems((current) =>
        current.map((entry) =>
          entry.id === updated.id
            ? {
                ...entry,
                isActive: updated.isActive,
              }
            : entry,
        ),
      );
      setMessage(
        `${updated.kode} berhasil ${updated.isActive ? "diaktifkan" : "dinonaktifkan"}.`,
      );
    } catch (toggleError) {
      console.error(toggleError);
      setError("Status SSD gagal diperbarui.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-6">
      <PageHero
        icon={FileSpreadsheet}
        eyebrow="Metadata Data"
        title="Kelola Data SSD"
        description="Setiap SSD dapat memiliki banyak variabel dan banyak indikator. Setiap indikator disusun dari satu atau lebih variabel SSD."
        meta={
          <p className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-pbd-blue">
            Tahun Anggaran {tahunAnggaran}
          </p>
        }
        aside={
          <Button
            type="button"
            onClick={() => {
              setImportOpen(true);
              setError(null);
            }}
            className="h-12 rounded-xl bg-pbd-navy px-5 text-white hover:bg-pbd-navy/90"
          >
            <Upload className="h-4 w-4" />
            Import XLSX
          </Button>
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        <StatCard label="Total SSD" value={String(items.length)} />
        <StatCard
          label="Variabel Metadata"
          value={String(items.reduce((sum, item) => sum + item.jumlahVariabel, 0))}
        />
        <StatCard label="Indikator Metadata" value={String(totalIndicators)} />
      </div>

      <SectionCard contentClassName="p-0">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-bold text-pbd-navy">Daftar SSD</h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredItems.length} dari {items.length} data ditampilkan. {activeCount} aktif.
              </p>
            </div>
            <SearchInput
              value={query}
              onChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
              placeholder="Cari kode, uraian, atau satuan..."
              className="sm:w-96"
            />
          </div>

          {message ? (
            <SuccessState message={message} className="mt-4" />
          ) : null}
          {error && !importOpen ? (
            <ErrorState message={error} className="mt-4" />
          ) : null}
        </div>

        <div className="p-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[64px]">No</TableHead>
                <TableHead className="w-[180px]">Kode</TableHead>
                <TableHead>Uraian SSD</TableHead>
                <TableHead className="w-[140px]">Variabel</TableHead>
                <TableHead className="w-[140px]">Indikator</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[80px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-slate-500">
                    Memuat data SSD...
                  </TableCell>
                </TableRow>
              ) : paginatedItems.length > 0 ? (
                paginatedItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-slate-500">
                      {(page - 1) * PAGE_SIZE + index + 1}
                    </TableCell>
                    <TableCell className="font-semibold text-pbd-navy">{item.kode}</TableCell>
                    <TableCell className="min-w-[360px] whitespace-normal text-slate-700">
                      <p>{item.uraian}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {item.satuan || "Tanpa satuan"}{item.definisiOperasional ? ` • ${item.definisiOperasional}` : ""}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                        {item.jumlahVariabel} variabel
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                        {item.jumlahIndikator} indikator
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          item.isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        }
                      >
                        {item.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 rounded-lg"
                              aria-label={`Aksi ${item.kode}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/ssd/${item.id}`}>
                                <FileSpreadsheet className="h-4 w-4" />
                                Kelola Metadata
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={saving}
                              onSelect={() => void handleToggleStatus(item)}
                            >
                              {item.isActive ? (
                                <ToggleRight className="h-4 w-4 text-emerald-700" />
                              ) : (
                                <ToggleLeft className="h-4 w-4 text-slate-500" />
                              )}
                              {item.isActive ? "Nonaktifkan SSD" : "Aktifkan SSD"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-6">
                    <EmptyState title="Data SSD belum tersedia" />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={filteredItems.length}
          onPageChange={setPage}
        />
      </SectionCard>

      <Dialog
        open={importOpen}
        onOpenChange={(open) => {
          if (!saving) {
            setImportOpen(open);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data SSD</DialogTitle>
            <DialogDescription>
              Upload file XLSX dengan kolom Kode DSSD, Uraian DSSD, Satuan, dan Definisi Operasional.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              className="h-11 rounded-lg"
            />
            {error ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                {error}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={saving} className="h-10 rounded-lg">
                <X className="h-4 w-4" />
                Batal
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleImport}
              disabled={saving}
              className="h-10 rounded-lg bg-pbd-navy text-white hover:bg-pbd-navy/90"
            >
              <Upload className="h-4 w-4" />
              {saving ? "Mengupload..." : "Upload XLSX"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
