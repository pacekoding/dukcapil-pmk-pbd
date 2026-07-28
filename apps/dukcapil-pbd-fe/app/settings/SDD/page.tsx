"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  MoreHorizontal,
  Plus,
  Save,
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
import { Textarea } from "@/components/ui/textarea";
import { createSSD, getSSD, importSSD, setSSDStatus } from "@/lib/api/ssd";
import { downloadXlsx } from "@/lib/xlsx";
import type { SSD, SSDPayload } from "@/types/ssd";

const PAGE_SIZE = 12;
type StatusFilter = "all" | "active" | "inactive";

const emptyForm: SSDPayload = {
  kode: "",
  uraian: "",
  satuan: "",
  definisiOperasional: "",
};

export default function DashboardSSDPage() {
  const [items, setItems] = useState<SSD[]>([]);
  const [tahunAnggaran, setTahunAnggaran] = useState("2026");
  const [form, setForm] = useState<SSDPayload>(emptyForm);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
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
        item.kode.toLowerCase().includes(normalizedQuery) ||
        item.uraian.toLowerCase().includes(normalizedQuery) ||
        item.satuan.toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? item.isActive : !item.isActive);

      return matchesQuery && matchesStatus;
    });
  }, [items, query, statusFilter]);

  const paginatedItems = useMemo(
    () => filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredItems, page],
  );

  const activeCount = useMemo(
    () => items.filter((item) => item.isActive).length,
    [items],
  );

  const openCreateForm = () => {
    if (!isSuperAdmin) {
      setError("Hanya superadmin yang dapat menambah SSD.");
      return;
    }
    setForm(emptyForm);
    setError(null);
    setCreateOpen(true);
  };

  const closeCreateForm = () => {
    if (saving) {
      return;
    }
    setCreateOpen(false);
    setForm(emptyForm);
    setError(null);
  };

  const handleCreate = async () => {
    if (!isSuperAdmin) {
      setError("Hanya superadmin yang dapat menambah SSD.");
      return;
    }

    const payload: SSDPayload = {
      kode: form.kode.trim(),
      uraian: form.uraian.trim(),
      satuan: form.satuan.trim(),
      definisiOperasional: form.definisiOperasional.trim(),
    };
    if (!payload.kode || !payload.uraian) {
      setError("Kode dan uraian SSD wajib diisi.");
      setMessage(null);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const created = await createSSD(payload);
      setItems((current) =>
        [...current, created].sort((a, b) => a.kode.localeCompare(b.kode)),
      );
      setCreateOpen(false);
      setForm(emptyForm);
      setMessage(`${created.kode} berhasil ditambahkan.`);
    } catch (createError) {
      console.error(createError);
      setError(
        createError instanceof Error
          ? createError.message
          : "SSD gagal ditambahkan. Pastikan kode belum dipakai pada tahun ini.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async () => {
    if (!isSuperAdmin) {
      setError("Hanya superadmin yang dapat import SSD.");
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
    if (!isSuperAdmin) {
      setError("Hanya superadmin yang dapat mengubah status SSD.");
      return;
    }

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

  const handleDownloadAll = () => {
    downloadXlsx({
      fileName: `data-sdd-${tahunAnggaran}-${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: "Data SDD",
      columns: [
        { width: 8 },
        { width: 24 },
        { width: 56 },
        { width: 20 },
        { width: 56 },
        { width: 18 },
        { width: 18 },
      ],
      rows: [
        [
          "No",
          "Kode DSSD",
          "Uraian DSSD",
          "Satuan",
          "Definisi Operasional",
          "Status",
          "Tahun Anggaran",
        ],
        ...items.map((item, index) => [
          index + 1,
          item.kode,
          item.uraian,
          item.satuan,
          item.definisiOperasional,
          item.isActive ? "Aktif" : "Nonaktif",
          item.tahunAnggaran,
        ]),
      ],
    });
  };

  return (
    <main className="space-y-6">
      <PageHero
        icon={FileSpreadsheet}
        eyebrow="Identitas Data"
        title="Kelola Data SSD"
        description="Kelola identitas SSD yang digunakan sebagai referensi data pada subkegiatan."
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
                  Tambah SSD
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
                href="/api/backend/ssd/template"
                download="template-upload-ssd.xlsx"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-pbd-blue underline-offset-4 hover:underline"
              >
                <Download className="h-4 w-4" />
                Download template XLSX
              </a>
            </div>
          ) : null
        }
      />

      <div className="grid gap-5 md:grid-cols-2">
        <StatCard label="Total SSD" value={String(items.length)} />
        <StatCard label="SSD Aktif" value={String(activeCount)} />
      </div>

      {createOpen ? (
        <SectionCard
          title="Tambah SSD"
          description={`Data disimpan untuk Tahun Anggaran ${tahunAnggaran}.`}
        >
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="ssd-kode">
                  Kode DSSD *
                </label>
                <Input
                  id="ssd-kode"
                  value={form.kode}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      kode: event.target.value,
                    }))
                  }
                  placeholder="Contoh: DSSD-001"
                  className="h-11 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="ssd-satuan">
                  Satuan
                </label>
                <Input
                  id="ssd-satuan"
                  value={form.satuan}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      satuan: event.target.value,
                    }))
                  }
                  placeholder="Contoh: Orang"
                  className="h-11 rounded-lg"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="ssd-uraian">
                  Uraian DSSD *
                </label>
                <Textarea
                  id="ssd-uraian"
                  value={form.uraian}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      uraian: event.target.value,
                    }))
                  }
                  placeholder="Uraian SSD"
                  className="min-h-24 rounded-lg"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="ssd-definisi-operasional"
                >
                  Definisi Operasional
                </label>
                <Textarea
                  id="ssd-definisi-operasional"
                  value={form.definisiOperasional}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      definisiOperasional: event.target.value,
                    }))
                  }
                  placeholder="Definisi operasional SSD"
                  className="min-h-24 rounded-lg"
                />
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
                onClick={closeCreateForm}
              >
                <X className="h-4 w-4" />
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleCreate}
                disabled={saving}
                className="h-10 rounded-lg bg-pbd-navy text-white hover:bg-pbd-navy/90"
              >
                <Save className="h-4 w-4" />
                {saving ? "Menyimpan..." : "Simpan Data"}
              </Button>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard contentClassName="p-0">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-bold text-pbd-navy">Daftar SSD</h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredItems.length} dari {items.length} data ditampilkan. {activeCount} aktif.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadAll}
                disabled={loading || items.length === 0}
                className="h-10 rounded-md"
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
                placeholder="Cari kode, uraian, atau satuan..."
                className="sm:w-72 xl:w-96"
              />
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as StatusFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10 w-full rounded-md sm:w-[180px]">
                  <SelectValue placeholder="Semua status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {message ? (
            <SuccessState message={message} className="mt-4" />
          ) : null}
          {error && !createOpen && !importOpen ? (
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
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[80px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-slate-500">
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
                              <Link href={`/dashboard/SDD/${item.id}`}>
                                <FileSpreadsheet className="h-4 w-4" />
                                {isSuperAdmin ? "Kelola Identitas" : "Lihat Detail"}
                              </Link>
                            </DropdownMenuItem>
                            {isSuperAdmin ? (
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
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-6">
                    <EmptyState
                      title={
                        items.length === 0
                          ? "Data SSD belum tersedia"
                          : "Tidak ada SSD yang sesuai filter"
                      }
                    />
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
              Upload file XLSX dengan kolom No, Kode DSSD, Uraian DSSD, Satuan, dan Definisi Operasional.
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
              {saving ? "Mengunggah..." : "Unggah XLSX"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
