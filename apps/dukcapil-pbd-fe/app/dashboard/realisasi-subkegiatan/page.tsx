"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Eye,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";

import { PageHero } from "@/components/dashboard/page-hero";
import { Pagination } from "@/components/dashboard/pagination";
import { SearchInput } from "@/components/dashboard/search-input";
import { SectionCard } from "@/components/dashboard/section-card";
import { EmptyState, ErrorState, SuccessState } from "@/components/dashboard/state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteRealisasiSubkegiatan,
  getRealisasiSubkegiatan,
} from "@/lib/api/realisasi-subkegiatan";
import type {
  RealisasiSubkegiatan,
  StatusCapaian,
} from "@/types/realisasi-subkegiatan";
import {
  formatCapaian,
  formatDate,
  formatOutputValue,
  formatOutputWithUnit,
  getSSDValueStatus,
  getStatusCapaianBadgeClass,
  statusCapaianOptions,
} from "@/components/dashboard/realisasi-subkegiatan-utils";

const PAGE_SIZE = 10;

export default function DashboardRealisasiSubkegiatanPage() {
  const [items, setItems] = useState<RealisasiSubkegiatan[]>([]);
  const [tahunAnggaran, setTahunAnggaran] = useState("2026");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusCapaian | "semua">(
    "semua",
  );
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<RealisasiSubkegiatan | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const data = await getRealisasiSubkegiatan();
        if (mounted) {
          setTahunAnggaran(data.tahunAnggaran);
          setItems(data.items);
          setError(null);
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError("Realisasi subkegiatan gagal dimuat.");
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

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        const result = await response.json();
        if (mounted) {
          setIsSuperAdmin(result.user?.role === "superadmin");
        }
      } catch (sessionError) {
        console.error(sessionError);
      }
    };

    void loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.nama.toLowerCase().includes(normalizedQuery) ||
        item.lokasi.toLowerCase().includes(normalizedQuery) ||
        item.fasilitator?.toLowerCase().includes(normalizedQuery) ||
        item.narasumber?.toLowerCase().includes(normalizedQuery) ||
        item.tujuanKegiatan?.toLowerCase().includes(normalizedQuery) ||
        item.poinPenting?.toLowerCase().includes(normalizedQuery) ||
        item.hasilKegiatan?.toLowerCase().includes(normalizedQuery) ||
        item.subkegiatan?.kode.toLowerCase().includes(normalizedQuery) ||
        item.subkegiatan?.nama.toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "semua" || item.statusCapaian === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [items, query, statusFilter]);

  const summary = useMemo(
    () => ({
      total: items.length,
      sudahAdaRealisasi: items.filter(
        (item) => (item.realisasiOutput ?? 0) > 0,
      ).length,
      belumAdaRealisasi: items.filter(
        (item) => (item.realisasiOutput ?? 0) <= 0,
      ).length,
      belumTercapai: items.filter(
        (item) => item.statusCapaian === "Belum Tercapai",
      ).length,
    }),
    [items],
  );

  const paginatedItems = useMemo(
    () => filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredItems, page],
  );

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    if (!isSuperAdmin) {
      setError("Hanya superadmin yang dapat menghapus realisasi.");
      return;
    }

    const item = deleteTarget;
    setDeletingId(item.id);
    setMessage(null);
    setError(null);
    try {
      await deleteRealisasiSubkegiatan(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setMessage(`${item.nama} berhasil dihapus.`);
      setDeleteTarget(null);
    } catch (deleteError) {
      console.error(deleteError);
      setError("Realisasi subkegiatan gagal dihapus.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHero
        icon={CalendarDays}
        eyebrow="Realisasi Subkegiatan"
        title="Kelola Realisasi Subkegiatan"
        description="Realisasi, evaluasi capaian, foto dokumentasi, dan dokumen pendukung tersimpan sesuai tahun anggaran login."
        meta={
          <p className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-pbd-blue">
            Tahun Anggaran {tahunAnggaran}
          </p>
        }
        aside={
          <Button
            asChild
            className="h-12 rounded-xl bg-pbd-navy px-5 text-white hover:bg-pbd-navy/90"
          >
            <Link href="/dashboard/realisasi-subkegiatan/tambah">
              <Plus className="h-4 w-4" />
              Tambah Realisasi
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total realisasi" value={summary.total} />
        <SummaryCard label="Sudah ada realisasi" value={summary.sudahAdaRealisasi} />
        <SummaryCard label="Belum ada realisasi" value={summary.belumAdaRealisasi} />
        <SummaryCard label="Belum tercapai" value={summary.belumTercapai} />
      </section>

      <SectionCard contentClassName="p-0">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-bold text-pbd-navy">Daftar Realisasi</h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredItems.length} dari {items.length} data ditampilkan.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px] lg:w-[680px]">
              <SearchInput
                value={query}
                onChange={(value) => {
                  setQuery(value);
                  setPage(1);
                }}
                placeholder="Cari realisasi, lokasi, atau subkegiatan..."
              />
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as StatusCapaian | "semua");
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-11 rounded-lg">
                  <SelectValue placeholder="Status capaian" />
                </SelectTrigger>
                <SelectContent>
                  {statusCapaianOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === "semua" ? "Semua status" : status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {message ? (
            <SuccessState message={message} className="mt-4" />
          ) : null}
          {error ? <ErrorState message={error} className="mt-4" /> : null}
        </div>

        <div className="p-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[56px]">No</TableHead>
                <TableHead className="w-[130px]">Tanggal</TableHead>
                <TableHead>Realisasi</TableHead>
                <TableHead>Subkegiatan</TableHead>
                <TableHead className="w-[190px]">Capaian</TableHead>
                <TableHead className="w-[150px]">Data SSD</TableHead>
                <TableHead className="w-[130px]">Lampiran</TableHead>
                <TableHead className="w-[76px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-slate-500">
                    Memuat realisasi subkegiatan...
                  </TableCell>
                </TableRow>
              ) : paginatedItems.length > 0 ? (
                paginatedItems.map((item, index) => {
                  const ssdStatus = getSSDValueStatus(item);
                  const StatusIcon =
                    ssdStatus.tone === "complete" ? CheckCircle2 : AlertCircle;

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-slate-500">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">
                        {formatDate(item.tanggal)}
                      </TableCell>
                      <TableCell className="min-w-[260px] whitespace-normal">
                        <div className="font-semibold text-pbd-navy">
                          {item.nama}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.lokasi || "-"}
                        </div>
                        {item.fasilitator ? (
                          <div className="mt-1 text-xs text-slate-500">
                            Fasilitator: {item.fasilitator}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="min-w-[280px] whitespace-normal">
                        <div className="font-semibold text-slate-800">
                          {item.subkegiatan?.kode ?? "-"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.subkegiatan?.nama ?? "Subkegiatan tidak ditemukan"}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <div className="space-y-1 text-xs text-slate-600">
                          <p>
                            Target:{" "}
                            <span className="font-semibold text-pbd-navy">
                              {formatOutputWithUnit(
                                item.targetOutput,
                                item.satuanOutput,
                              )}
                            </span>
                          </p>
                          <p>
                            Realisasi:{" "}
                            <span className="font-semibold text-pbd-navy">
                              {formatOutputWithUnit(
                                item.realisasiOutput,
                                item.satuanOutput,
                              )}
                            </span>
                          </p>
                          <p>
                            Capaian:{" "}
                            <span className="font-semibold text-pbd-navy">
                              {formatCapaian(item.persentaseCapaian)}
                            </span>
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`mt-2 ${getStatusCapaianBadgeClass(
                            item.statusCapaian,
                          )}`}
                        >
                          {item.statusCapaian}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={ssdStatus.className}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {ssdStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant="outline"
                            className="border-blue-200 bg-blue-50 text-blue-700"
                          >
                            {item.jumlahFoto} foto
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              item.jumlahDokumen > 0
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }
                          >
                            {item.jumlahDokumen} dokumen
                          </Badge>
                        </div>
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
                                aria-label={`Aksi ${item.nama}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/realisasi-subkegiatan/${item.id}`}>
                                  <Eye className="h-4 w-4" />
                                  Lihat detail
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/dashboard/realisasi-subkegiatan/${item.id}/ubah`}
                                >
                                  <Edit3 className="h-4 w-4" />
                                  Ubah
                                </Link>
                              </DropdownMenuItem>
                              {isSuperAdmin ? (
                                <DropdownMenuItem
                                  variant="destructive"
                                  disabled={deletingId === item.id}
                                  onSelect={() => setDeleteTarget(item)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Hapus
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="py-6">
                    <EmptyState title="Realisasi subkegiatan belum tersedia" />
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
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deletingId) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Realisasi?</DialogTitle>
            <DialogDescription>
              Realisasi {deleteTarget?.nama} akan dihapus dari tahun anggaran
              aktif. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(deletingId)}
              onClick={() => setDeleteTarget(null)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={Boolean(deletingId)}
              onClick={() => void confirmDelete()}
            >
              <Trash2 className="h-4 w-4" />
              {deletingId ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-pbd-navy">
        {formatOutputValue(value)}
      </p>
    </div>
  );
}
