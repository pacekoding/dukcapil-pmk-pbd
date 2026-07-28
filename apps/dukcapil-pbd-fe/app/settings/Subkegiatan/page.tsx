"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Edit3,
  Eye,
  ListChecks,
  MoreHorizontal,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";

import { PageHero } from "@/components/dashboard/page-hero";
import { Pagination } from "@/components/dashboard/pagination";
import { SearchInput } from "@/components/dashboard/search-input";
import { SectionCard } from "@/components/dashboard/section-card";
import { EmptyState, ErrorState, SuccessState } from "@/components/dashboard/state";
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
import { Label } from "@/components/ui/label";
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
  createSubkegiatan,
  deleteSubkegiatan,
  getSubkegiatan,
  importSubkegiatan,
  updateSubkegiatan,
} from "@/lib/api/subkegiatan";
import { ApiError } from "@/lib/api/http";
import { getSSD } from "@/lib/api/ssd";
import { cn } from "@/lib/utils";
import { downloadXlsx } from "@/lib/xlsx";
import type { SSD } from "@/types/ssd";
import type {
  Subkegiatan,
  SubkegiatanBidang,
  SubkegiatanPayload,
} from "@/types/subkegiatan";

const bidangOptions: Array<{ value: SubkegiatanBidang; label: string }> = [
  { value: "dukcapil", label: "Dukcapil" },
  { value: "pmk", label: "PMK" },
  { value: "umum", label: "Umum" },
];

const emptyForm: SubkegiatanPayload = {
  kode: "",
  nama: "",
  bidang: "dukcapil",
  ssdIds: [],
};

const subkegiatanKodePattern = /^\d+(?:\.\d+)+$/;
const maxSubkegiatanKodeLength = 64;

const bidangLabel = (bidang: SubkegiatanBidang) =>
  bidangOptions.find((item) => item.value === bidang)?.label ?? bidang;

const detectBidangByKode = (kode: string): SubkegiatanBidang => {
  const normalized = kode.trim();
  if (normalized.startsWith("2.12.")) {
    return "dukcapil";
  }
  if (normalized.startsWith("2.13")) {
    return "pmk";
  }
  return "umum";
};

const PAGE_SIZE = 12;

export default function DashboardSubkegiatanPage() {
  const [items, setItems] = useState<Subkegiatan[]>([]);
  const [ssdItems, setSSDItems] = useState<SSD[]>([]);
  const [tahunAnggaran, setTahunAnggaran] = useState("2026");
  const [form, setForm] = useState<SubkegiatanPayload>(emptyForm);
  const [editingItem, setEditingItem] = useState<Subkegiatan | null>(null);
  const [detailItem, setDetailItem] = useState<Subkegiatan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subkegiatan | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [ssdQuery, setSSDQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bidangFilter, setBidangFilter] = useState<SubkegiatanBidang | "semua">(
    "semua",
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadItems = async () => {
      try {
        const [data, ssdResponse] = await Promise.all([getSubkegiatan(), getSSD()]);
        if (mounted) {
          setTahunAnggaran(data.tahunAnggaran);
          setItems(data.items);
          setSSDItems(ssdResponse.items);
          setError(null);
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setError("Subkegiatan gagal dimuat.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadItems();

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
        normalizedQuery === "" ||
        item.kode.toLowerCase().includes(normalizedQuery) ||
        item.nama.toLowerCase().includes(normalizedQuery) ||
        (item.ssdItems ?? []).some(
          (ssd) =>
            ssd.kode.toLowerCase().includes(normalizedQuery) ||
            ssd.uraian.toLowerCase().includes(normalizedQuery) ||
            ssd.satuan.toLowerCase().includes(normalizedQuery),
        );
      const matchesBidang =
        bidangFilter === "semua" || item.bidang === bidangFilter;

      return matchesQuery && matchesBidang;
    });
  }, [bidangFilter, items, query]);

  const paginatedItems = useMemo(
    () => filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredItems, page],
  );

  const selectableSSDItems = useMemo(
    () =>
      ssdItems.filter(
        (item) =>
          (item.isActive || form.ssdIds.includes(item.id)) &&
          (ssdQuery.trim() === "" ||
            item.kode.toLowerCase().includes(ssdQuery.trim().toLowerCase()) ||
            item.uraian.toLowerCase().includes(ssdQuery.trim().toLowerCase()) ||
            item.satuan.toLowerCase().includes(ssdQuery.trim().toLowerCase())),
      ),
    [form.ssdIds, ssdItems, ssdQuery],
  );
  const detectedBidang = useMemo(
    () => detectBidangByKode(form.kode),
    [form.kode],
  );

  const openCreateForm = () => {
    if (!isSuperAdmin) {
      setError("Hanya superadmin yang dapat menambah subkegiatan.");
      return;
    }
    setEditingItem(null);
    setForm(emptyForm);
    setSSDQuery("");
    setError(null);
    setFormOpen(true);
  };

  const openEditForm = (item: Subkegiatan) => {
    if (!isSuperAdmin) {
      setError("Hanya superadmin yang dapat mengubah subkegiatan.");
      return;
    }
    setEditingItem(item);
    setForm({
      kode: item.kode,
      nama: item.nama,
      bidang: detectBidangByKode(item.kode),
      ssdIds: item.ssdItems.map((ssd) => ssd.id),
    });
    setSSDQuery("");
    setError(null);
    setFormOpen(true);
  };

  const openDetailDialog = (item: Subkegiatan) => {
    setDetailItem(item);
    setDetailOpen(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }
    setFormOpen(false);
    setEditingItem(null);
    setForm(emptyForm);
    setSSDQuery("");
    setError(null);
  };

  const closeImportDialog = () => {
    if (saving) {
      return;
    }
    setImportOpen(false);
    setSelectedFile(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!isSuperAdmin) {
      setError("Hanya superadmin yang dapat menyimpan subkegiatan.");
      return;
    }

    const payload = {
      kode: form.kode.trim(),
      nama: form.nama.trim(),
      bidang: detectBidangByKode(form.kode),
      ssdIds: form.ssdIds,
    };

    if (!payload.kode || !payload.nama) {
      setError("Kode dan nama subkegiatan wajib diisi.");
      setMessage(null);
      return;
    }
    if (
      subkegiatanKodePattern.test(payload.nama) &&
      !subkegiatanKodePattern.test(payload.kode)
    ) {
      setError("Kode dan nama subkegiatan tampak tertukar.");
      setMessage(null);
      return;
    }
    if (payload.kode.length > maxSubkegiatanKodeLength) {
      setError("Kode subkegiatan maksimal 64 karakter.");
      setMessage(null);
      return;
    }
    if (!subkegiatanKodePattern.test(payload.kode)) {
      setError("Format kode subkegiatan tidak valid. Contoh: 2.13.03.4.01.0004.");
      setMessage(null);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (editingItem) {
        const updated = await updateSubkegiatan(editingItem.id, payload);
        setItems((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
        setMessage(`${updated.kode} berhasil diperbarui.`);
      } else {
        const created = await createSubkegiatan(payload);
        setItems((current) =>
          [...current, created].sort((a, b) => a.kode.localeCompare(b.kode)),
        );
        setMessage(`${created.kode} berhasil ditambahkan.`);
      }
      setFormOpen(false);
      setForm(emptyForm);
      setEditingItem(null);
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Subkegiatan gagal disimpan. Pastikan kode belum dipakai pada tahun ini.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async () => {
    if (!isSuperAdmin) {
      setError("Hanya superadmin yang dapat import subkegiatan.");
      return;
    }
    if (!selectedFile) {
      setError("Pilih file XLSX terlebih dahulu.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const result = await importSubkegiatan(selectedFile);
      const refreshed = await getSubkegiatan();
      setItems(refreshed.items);
      setTahunAnggaran(refreshed.tahunAnggaran);
      setImportOpen(false);
      setSelectedFile(null);
      setMessage(
        `Import subkegiatan selesai. ${result.created} data baru dan ${result.updated} data diperbarui.`,
      );
    } catch (importError) {
      console.error(importError);
      setError(
        importError instanceof Error
          ? importError.message
          : "Import subkegiatan gagal diproses.",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    if (!isSuperAdmin) {
      setError("Hanya superadmin yang dapat menghapus subkegiatan.");
      return;
    }

    const item = deleteTarget;
    setDeletingId(item.id);
    setMessage(null);
    setError(null);
    try {
      await deleteSubkegiatan(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      if (editingItem?.id === item.id) {
        setForm(emptyForm);
        setEditingItem(null);
        setFormOpen(false);
      }
      setMessage(`${item.kode} berhasil dihapus.`);
      setDeleteTarget(null);
    } catch (deleteError) {
      console.error(deleteError);
      if (deleteError instanceof ApiError && deleteError.status === 404) {
        setItems((current) => current.filter((entry) => entry.id !== item.id));
        setMessage(`${item.kode} tidak ditemukan di server. Daftar diperbarui.`);
        setDeleteTarget(null);
        return;
      }
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Subkegiatan gagal dihapus.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadAll = () => {
    downloadXlsx({
      fileName: `data-subkegiatan-${tahunAnggaran}-${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: "Data Subkegiatan",
      columns: [
        { width: 8 },
        { width: 26 },
        { width: 64 },
        { width: 18 },
        { width: 14 },
        { width: 40 },
        { width: 64 },
        { width: 18 },
      ],
      rows: [
        [
          "No",
          "Kode Subkegiatan",
          "Nama Subkegiatan",
          "Bidang",
          "Jumlah SSD",
          "Kode DSSD Terkait",
          "Uraian DSSD Terkait",
          "Tahun Anggaran",
        ],
        ...items.map((item, index) => [
          index + 1,
          item.kode,
          item.nama,
          bidangLabel(item.bidang),
          item.ssdItems.length,
          item.ssdItems.map((ssd) => ssd.kode).join(", "),
          item.ssdItems
            .map((ssd) => `${ssd.kode} - ${ssd.uraian}`)
            .join("\n"),
          item.tahunAnggaran,
        ]),
      ],
    });
  };

  return (
    <div className="space-y-6">
      <PageHero
        icon={ListChecks}
        eyebrow="Subkegiatan"
        title="Kelola Master Subkegiatan"
        description="Data subkegiatan tersimpan sesuai tahun anggaran yang dipilih saat login."
        meta={
          <p className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-pbd-blue">
            Tahun Anggaran {tahunAnggaran}
          </p>
        }
        aside={
          isSuperAdmin ? (
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  onClick={openCreateForm}
                  className="h-12 rounded-xl bg-white px-5 text-pbd-navy ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Subkegiatan
                </Button>
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
              </div>
              <a
                href="/api/backend/subkegiatan/template"
                download="template-upload-subkegiatan.xlsx"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-pbd-blue underline-offset-4 hover:underline"
              >
                <Download className="h-4 w-4" />
                Download template XLSX
              </a>
            </div>
          ) : null
        }
      />

      {formOpen ? (
        <SectionCard
          title={editingItem ? "Edit Subkegiatan" : "Tambah Subkegiatan"}
          description={`Data disimpan untuk Tahun Anggaran ${tahunAnggaran}.`}
        >
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="kode">Kode *</Label>
                <Input
                  id="kode"
                  value={form.kode}
                  maxLength={maxSubkegiatanKodeLength}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      kode: event.target.value,
                      bidang: detectBidangByKode(event.target.value),
                    }))
                  }
                  placeholder="Contoh: 2.12.01.1.01.0001"
                  className="h-11 rounded-lg"
                />
                <p className="text-xs leading-5 text-slate-500">
                  Isi hanya kode angka bertitik, maksimal 64 karakter.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Bidang</Label>
                <div
                  className={cn(
                    "flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 py-2",
                    detectedBidang === "dukcapil" &&
                      "border-blue-200 bg-blue-50 text-blue-700",
                    detectedBidang === "pmk" &&
                      "border-emerald-200 bg-emerald-50 text-emerald-700",
                    detectedBidang === "umum" &&
                      "border-slate-200 bg-slate-50 text-slate-700",
                  )}
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      "bg-white font-semibold",
                      detectedBidang === "dukcapil" &&
                        "border-blue-200 text-blue-700",
                      detectedBidang === "pmk" &&
                        "border-emerald-200 text-emerald-700",
                      detectedBidang === "umum" &&
                        "border-slate-200 text-slate-700",
                    )}
                  >
                    {bidangLabel(detectedBidang)}
                  </Badge>
                  <span className="text-xs font-medium text-current/70">
                    Otomatis dari kode
                  </span>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nama">Nama *</Label>
                <Input
                  id="nama"
                  value={form.nama}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      nama: event.target.value,
                    }))
                  }
                  placeholder="Nama subkegiatan"
                  className="h-11 rounded-lg"
                />
              </div>

              <div className="space-y-3 md:col-span-2">
                <div>
                  <Label>SSD Terkait</Label>
                  <p className="mt-1 text-xs text-slate-500">
                    Pilih satu atau lebih SSD aktif untuk diintegrasikan ke subkegiatan ini.
                  </p>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={ssdQuery}
                    onChange={(event) => setSSDQuery(event.target.value)}
                    placeholder="Cari kode atau uraian DSSD..."
                    className="h-11 rounded-lg pl-9"
                  />
                </div>
                <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
                  {selectableSSDItems.length > 0 ? (
                    selectableSSDItems.map((ssd) => {
                      const checked = form.ssdIds.includes(ssd.id);
                      return (
                        <label
                          key={ssd.id}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition",
                            checked
                              ? "border-pbd-blue bg-blue-50/70"
                              : "border-slate-200 hover:border-slate-300",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                ssdIds: event.target.checked
                                  ? [...current.ssdIds, ssd.id]
                                  : current.ssdIds.filter((id) => id !== ssd.id),
                              }))
                            }
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-pbd-blue"
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-pbd-navy">
                                {ssd.kode}
                              </span>
                              {!ssd.isActive ? (
                                <Badge
                                  variant="outline"
                                  className="border-amber-200 bg-amber-50 text-amber-700"
                                >
                                  Nonaktif
                                </Badge>
                              ) : null}
                              {ssd.satuan ? (
                                <Badge
                                  variant="outline"
                                  className="border-slate-200 bg-white text-slate-600"
                                >
                                  {ssd.satuan}
                                </Badge>
                              ) : null}
                            </div>
                            <p className="mt-1 text-sm text-slate-600">
                              {ssd.uraian}
                            </p>
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-500">
                      {ssdQuery.trim()
                        ? "DSSD tidak ditemukan."
                        : "Belum ada SSD aktif. Import SSD terlebih dahulu."}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {error ? (
              <ErrorState message={error} />
            ) : null}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                className="h-10 rounded-lg"
                onClick={closeForm}
              >
                <X className="h-4 w-4" />
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="h-10 rounded-lg bg-pbd-navy text-white hover:bg-pbd-navy/90"
              >
                <Save className="h-4 w-4" />
                {saving
                  ? "Menyimpan..."
                  : editingItem
                    ? "Simpan Perubahan"
                    : "Simpan Data"}
              </Button>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard contentClassName="p-0">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-bold text-pbd-navy">Daftar Subkegiatan</h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredItems.length} dari {items.length} data ditampilkan.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadAll}
                disabled={loading || items.length === 0}
                className="h-11 rounded-lg"
              >
                <Download className="h-4 w-4" />
                Download Semua Data
              </Button>
              <SearchInput
                value={query}
                onChange={(value) => {
                  setQuery(value);
                  setPage(1);
                }}
                placeholder="Cari kode, nama, atau kode SSD..."
                className="sm:w-72"
              />
              <Select
                value={bidangFilter}
                onValueChange={(value) => {
                  setBidangFilter(value as SubkegiatanBidang | "semua");
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-11 w-full rounded-lg sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Bidang</SelectItem>
                  {bidangOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {message ? (
            <SuccessState message={message} className="mt-4" />
          ) : null}
          {error && !formOpen && !importOpen ? (
            <ErrorState message={error} className="mt-4" />
          ) : null}
        </div>

        <div className="p-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[64px]">No</TableHead>
                <TableHead className="w-[220px]">Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="w-[150px]">Bidang</TableHead>
                <TableHead className="w-[180px]">SSD</TableHead>
                <TableHead className="w-[80px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-slate-500">
                    Memuat subkegiatan...
                  </TableCell>
                </TableRow>
              ) : paginatedItems.length > 0 ? (
                paginatedItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-slate-500">
                      {(page - 1) * PAGE_SIZE + index + 1}
                    </TableCell>
                    <TableCell className="font-semibold text-pbd-navy">
                      {item.kode}
                    </TableCell>
                    <TableCell className="min-w-[320px] whitespace-normal text-slate-700">
                      {item.nama}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-pbd-blue/30 bg-pbd-blue/5 text-pbd-blue",
                          item.bidang === "pmk" &&
                            "border-emerald-200 bg-emerald-50 text-emerald-700",
                          item.bidang === "umum" &&
                            "border-slate-200 bg-slate-50 text-slate-700",
                        )}
                      >
                        {bidangLabel(item.bidang)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {item.ssdItems.length > 0 ? (
                          <>
                            <Badge
                              variant="outline"
                              className="border-blue-200 bg-blue-50 text-blue-700"
                            >
                              {item.ssdItems.length} SSD
                            </Badge>
                            {item.ssdItems.slice(0, 2).map((ssd) => (
                              <Badge
                                key={ssd.id}
                                asChild
                                variant="outline"
                                className="max-w-[160px] truncate border-slate-200 bg-slate-50 text-slate-700"
                              >
                                <Link href={`/dashboard/SDD/${ssd.id}`}>{ssd.kode}</Link>
                              </Badge>
                            ))}
                          </>
                        ) : (
                          <span className="text-sm text-slate-400">Belum dipilih</span>
                        )}
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
                              aria-label={`Aksi ${item.kode}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onSelect={() => openDetailDialog(item)}>
                              <Eye className="h-4 w-4" />
                              Lihat detail
                            </DropdownMenuItem>
                            {isSuperAdmin ? (
                              <>
                                <DropdownMenuItem onSelect={() => openEditForm(item)}>
                                  <Edit3 className="h-4 w-4" />
                                  Ubah
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  disabled={deletingId === item.id}
                                  onSelect={() => setDeleteTarget(item)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Hapus
                                </DropdownMenuItem>
                              </>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-6">
                    <EmptyState title="Subkegiatan belum tersedia" />
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
          if (open) {
            setImportOpen(true);
          } else {
            closeImportDialog();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Subkegiatan</DialogTitle>
            <DialogDescription>
              Gunakan template XLSX dengan kolom No, Kode Subkegiatan, Nama
              Subkegiatan, dan Kode DSSD Terkait. Isi beberapa Kode DSSD dengan
              pemisah koma.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <a
              href="/api/backend/subkegiatan/template"
              download="template-upload-subkegiatan.xlsx"
              className="inline-flex items-center gap-2 text-sm font-semibold text-pbd-blue underline-offset-4 hover:underline"
            >
              <Download className="h-4 w-4" />
              Download template XLSX
            </a>
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
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                className="h-10 rounded-lg"
              >
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
              {saving ? "Mengunggah..." : "Unggah XLSX"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            setDetailItem(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detail Subkegiatan</DialogTitle>
            <DialogDescription>
              Informasi subkegiatan dan SSD yang terintegrasi pada Tahun Anggaran {tahunAnggaran}.
            </DialogDescription>
          </DialogHeader>

          {detailItem ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Kode
                  </p>
                  <p className="mt-2 font-semibold text-pbd-navy">{detailItem.kode}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Bidang
                  </p>
                  <div className="mt-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "border-pbd-blue/30 bg-pbd-blue/5 text-pbd-blue",
                        detailItem.bidang === "pmk" &&
                          "border-emerald-200 bg-emerald-50 text-emerald-700",
                        detailItem.bidang === "umum" &&
                          "border-slate-200 bg-slate-50 text-slate-700",
                      )}
                    >
                      {bidangLabel(detailItem.bidang)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Nama Subkegiatan
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{detailItem.nama}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-pbd-navy">SSD Terkait</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {detailItem.ssdItems.length} SSD terhubung ke subkegiatan ini.
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-blue-200 bg-blue-50 text-blue-700"
                    >
                      {detailItem.ssdItems.length} SSD
                    </Badge>
                  </div>
                </div>

                <div className="max-h-80 space-y-3 overflow-y-auto p-4">
                  {detailItem.ssdItems.length > 0 ? (
                    detailItem.ssdItems.map((ssd) => (
                      <div
                        key={ssd.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            asChild
                            variant="outline"
                            className="border-slate-200 bg-white text-pbd-navy"
                          >
                            <Link href={`/dashboard/SDD/${ssd.id}`}>{ssd.kode}</Link>
                          </Badge>
                          {ssd.satuan ? (
                            <Badge
                              variant="outline"
                              className="border-slate-200 bg-white text-slate-600"
                            >
                              {ssd.satuan}
                            </Badge>
                          ) : null}
                          {!ssd.isActive ? (
                            <Badge
                              variant="outline"
                              className="border-amber-200 bg-amber-50 text-amber-700"
                            >
                              Nonaktif
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{ssd.uraian}</p>
                        {ssd.definisiOperasional ? (
                          <p className="mt-2 text-xs leading-5 text-slate-500">
                            {ssd.definisiOperasional}
                          </p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                      Belum ada SSD yang terhubung ke subkegiatan ini.
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-10 rounded-lg">
                <X className="h-4 w-4" />
                Tutup
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <DialogTitle>Hapus Subkegiatan?</DialogTitle>
            <DialogDescription>
              Subkegiatan {deleteTarget?.kode} - {deleteTarget?.nama} akan
              dihapus dari tahun anggaran aktif. Tindakan ini tidak dapat
              dibatalkan.
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
