"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Edit3,
  Eye,
  FileUp,
  ImageUp,
  MoreHorizontal,
  Plus,
  Save,
  Trash2,
  X,
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
import { Textarea } from "@/components/ui/textarea";
import {
  createRealisasiSubkegiatan,
  deleteRealisasiSubkegiatan,
  getRealisasiSubkegiatan,
  getRealisasiSubkegiatanDetail,
  updateRealisasiSubkegiatan,
  uploadRealisasiDokumen,
  uploadRealisasiFoto,
} from "@/lib/api/realisasi-subkegiatan";
import { getSubkegiatan } from "@/lib/api/subkegiatan";
import type {
  RealisasiFile,
  RealisasiSubkegiatan,
  RealisasiSubkegiatanPayload,
} from "@/types/realisasi-subkegiatan";
import type { Subkegiatan } from "@/types/subkegiatan";

type DialogMode = "detail" | "form" | "foto" | "dokumen" | null;

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = (): RealisasiSubkegiatanPayload => ({
  subkegiatanId: 0,
  tanggal: today(),
  nama: "",
  lokasi: "",
  keterangan: "",
});

const backendAssetOrigin =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "http://localhost:8080";

const assetUrl = (url: string) =>
  url.startsWith("http") ? url : `${backendAssetOrigin}${url}`;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const PAGE_SIZE = 10;

export default function DashboardRealisasiSubkegiatanPage() {
  const [items, setItems] = useState<RealisasiSubkegiatan[]>([]);
  const [subkegiatan, setSubkegiatan] = useState<Subkegiatan[]>([]);
  const [tahunAnggaran, setTahunAnggaran] = useState("2026");
  const [selectedItem, setSelectedItem] =
    useState<RealisasiSubkegiatan | null>(null);
  const [form, setForm] = useState<RealisasiSubkegiatanPayload>(emptyForm);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [photoFiles, setPhotoFiles] = useState<FileList | null>(null);
  const [documentFiles, setDocumentFiles] = useState<FileList | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [realisasiData, subkegiatanData] = await Promise.all([
          getRealisasiSubkegiatan(),
          getSubkegiatan(),
        ]);
        if (mounted) {
          setTahunAnggaran(realisasiData.tahunAnggaran);
          setItems(realisasiData.items);
          setSubkegiatan(subkegiatanData.items);
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

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      if (!normalizedQuery) {
        return true;
      }

      return (
        item.nama.toLowerCase().includes(normalizedQuery) ||
        item.lokasi.toLowerCase().includes(normalizedQuery) ||
        item.subkegiatan?.kode.toLowerCase().includes(normalizedQuery) ||
        item.subkegiatan?.nama.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [items, query]);

  const paginatedItems = useMemo(
    () => filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredItems, page],
  );

  const closeDialog = () => {
    if (saving) {
      return;
    }
    setDialogMode(null);
    setSelectedItem(null);
    setForm(emptyForm());
    setPhotoFiles(null);
    setDocumentFiles(null);
    setError(null);
  };

  const openCreateDialog = () => {
    setSelectedItem(null);
    setForm({
      ...emptyForm(),
      subkegiatanId: subkegiatan[0]?.id ?? 0,
    });
    setError(null);
    setDialogMode("form");
  };

  const openEditDialog = (item: RealisasiSubkegiatan) => {
    setSelectedItem(item);
    setForm({
      subkegiatanId: item.subkegiatanId,
      tanggal: item.tanggal,
      nama: item.nama,
      lokasi: item.lokasi,
      keterangan: item.keterangan,
    });
    setError(null);
    setDialogMode("form");
  };

  const openDetailDialog = async (item: RealisasiSubkegiatan) => {
    setDialogMode("detail");
    setError(null);
    try {
      const detail = await getRealisasiSubkegiatanDetail(item.id);
      setSelectedItem(detail);
    } catch (detailError) {
      console.error(detailError);
      setSelectedItem(item);
      setError("Detail realisasi gagal dimuat.");
    }
  };

  const openUploadDialog = async (
    item: RealisasiSubkegiatan,
    mode: "foto" | "dokumen",
  ) => {
    setDialogMode(mode);
    setPhotoFiles(null);
    setDocumentFiles(null);
    setError(null);
    try {
      const detail = await getRealisasiSubkegiatanDetail(item.id);
      setSelectedItem(detail);
    } catch (detailError) {
      console.error(detailError);
      setSelectedItem(item);
    }
  };

  const replaceItem = (updated: RealisasiSubkegiatan) => {
    setItems((current) =>
      current.some((item) => item.id === updated.id)
        ? current.map((item) => (item.id === updated.id ? updated : item))
        : [updated, ...current],
    );
    setSelectedItem(updated);
  };

  const handleSubmit = async () => {
    const payload = {
      subkegiatanId: form.subkegiatanId,
      tanggal: form.tanggal,
      nama: form.nama.trim(),
      lokasi: form.lokasi.trim(),
      keterangan: form.keterangan.trim(),
    };

    if (!payload.subkegiatanId || !payload.tanggal || !payload.nama) {
      setError("Subkegiatan, tanggal, dan nama realisasi wajib diisi.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const saved = selectedItem
        ? await updateRealisasiSubkegiatan(selectedItem.id, payload)
        : await createRealisasiSubkegiatan(payload);
      replaceItem(saved);
      setMessage(`${saved.nama} berhasil disimpan.`);
      closeDialog();
    } catch (saveError) {
      console.error(saveError);
      setError("Realisasi subkegiatan gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: RealisasiSubkegiatan) => {
    const confirmed = window.confirm(`Hapus realisasi ${item.nama}?`);
    if (!confirmed) {
      return;
    }

    setDeletingId(item.id);
    setMessage(null);
    setError(null);
    try {
      await deleteRealisasiSubkegiatan(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setMessage(`${item.nama} berhasil dihapus.`);
    } catch (deleteError) {
      console.error(deleteError);
      setError("Realisasi subkegiatan gagal dihapus.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUploadFoto = async () => {
    if (!selectedItem || !photoFiles?.length) {
      setError("Pilih minimal satu foto dokumentasi.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await uploadRealisasiFoto(selectedItem.id, photoFiles);
      replaceItem(updated);
      setMessage("Foto dokumentasi berhasil ditambahkan.");
      closeDialog();
    } catch (uploadError) {
      console.error(uploadError);
      setError("Foto dokumentasi gagal diupload.");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDokumen = async () => {
    if (!selectedItem || !documentFiles?.length) {
      setError("Pilih minimal satu dokumen PDF.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await uploadRealisasiDokumen(selectedItem.id, documentFiles);
      replaceItem(updated);
      setMessage("Dokumen berhasil ditambahkan.");
      closeDialog();
    } catch (uploadError) {
      console.error(uploadError);
      setError("Dokumen gagal diupload. Pastikan file berbentuk PDF.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHero
        icon={CalendarDays}
        eyebrow="Realisasi Subkegiatan"
        title="Kelola Realisasi Subkegiatan"
        description="Realisasi, foto dokumentasi, dan dokumen pendukung tersimpan sesuai tahun anggaran login."
        meta={
          <p className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-pbd-blue">
            Tahun Anggaran {tahunAnggaran}
          </p>
        }
        aside={
          <Button
            type="button"
            onClick={openCreateDialog}
            className="h-12 rounded-xl bg-pbd-navy px-5 text-white hover:bg-pbd-navy/90"
          >
            <Plus className="h-4 w-4" />
            Tambah Realisasi
          </Button>
        }
      />

      <SectionCard contentClassName="p-0">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-bold text-pbd-navy">Daftar Realisasi</h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredItems.length} dari {items.length} data ditampilkan.
              </p>
            </div>
            <SearchInput
              value={query}
              onChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
              placeholder="Cari realisasi, lokasi, atau subkegiatan..."
              className="sm:w-96"
            />
          </div>

          {message ? (
            <SuccessState message={message} className="mt-4" />
          ) : null}
          {error && !dialogMode ? (
            <ErrorState message={error} className="mt-4" />
          ) : null}
        </div>

        <div className="p-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[56px]">No</TableHead>
                <TableHead className="w-[130px]">Tanggal</TableHead>
                <TableHead>Realisasi</TableHead>
                <TableHead>Subkegiatan</TableHead>
                <TableHead className="w-[130px]">Lampiran</TableHead>
                <TableHead className="w-[76px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-slate-500">
                    Memuat realisasi subkegiatan...
                  </TableCell>
                </TableRow>
              ) : paginatedItems.length > 0 ? (
                paginatedItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-slate-500">
                      {(page - 1) * PAGE_SIZE + index + 1}
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">
                      {formatDate(item.tanggal)}
                    </TableCell>
                    <TableCell className="min-w-[260px] whitespace-normal">
                      <div className="font-semibold text-pbd-navy">{item.nama}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {item.lokasi || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[280px] whitespace-normal">
                      <div className="font-semibold text-slate-800">
                        {item.subkegiatan?.kode ?? "-"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {item.subkegiatan?.nama ?? "Subkegiatan tidak ditemukan"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                          {item.jumlahFoto} foto
                        </Badge>
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
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
                          <DropdownMenuContent align="end" className="w-64">
                            <DropdownMenuItem onSelect={() => openDetailDialog(item)}>
                              <Eye className="h-4 w-4" />
                              Lihat details
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => openEditDialog(item)}>
                              <Edit3 className="h-4 w-4" />
                              Ubah
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => openUploadDialog(item, "foto")}
                            >
                              <ImageUp className="h-4 w-4" />
                              Tambah Foto Dokumentasi
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => openUploadDialog(item, "dokumen")}
                            >
                              <FileUp className="h-4 w-4" />
                              Tambah Dokumen
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              disabled={deletingId === item.id}
                              onSelect={() => handleDelete(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-6">
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

      <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && closeDialog()}>
        {dialogMode === "form" ? (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedItem ? "Ubah Realisasi" : "Tambah Realisasi"}
              </DialogTitle>
              <DialogDescription>
                Data disimpan untuk Tahun Anggaran {tahunAnggaran}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Subkegiatan</Label>
                <Select
                  value={form.subkegiatanId ? String(form.subkegiatanId) : undefined}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      subkegiatanId: Number(value),
                    }))
                  }
                >
                  <SelectTrigger className="h-11 w-full rounded-lg">
                    <SelectValue placeholder="Pilih subkegiatan" />
                  </SelectTrigger>
                  <SelectContent>
                    {subkegiatan.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.kode} - {item.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggal">Tanggal</Label>
                <Input
                  id="tanggal"
                  type="date"
                  value={form.tanggal}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      tanggal: event.target.value,
                    }))
                  }
                  className="h-11 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lokasi">Lokasi</Label>
                <Input
                  id="lokasi"
                  value={form.lokasi}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      lokasi: event.target.value,
                    }))
                  }
                  className="h-11 rounded-lg"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nama">Nama Realisasi</Label>
                <Input
                  id="nama"
                  value={form.nama}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, nama: event.target.value }))
                  }
                  className="h-11 rounded-lg"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="keterangan">Keterangan</Label>
                <Textarea
                  id="keterangan"
                  value={form.keterangan}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      keterangan: event.target.value,
                    }))
                  }
                  className="min-h-28 rounded-lg"
                />
              </div>
            </div>
            {error ? <DialogError message={error} /> : null}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={saving}>
                  <X className="h-4 w-4" />
                  Batal
                </Button>
              </DialogClose>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
              >
                <Save className="h-4 w-4" />
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}

        {dialogMode === "detail" && selectedItem ? (
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedItem.nama}</DialogTitle>
              <DialogDescription>
                {formatDate(selectedItem.tanggal)} - {selectedItem.lokasi || "-"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-4">
                <DetailBlock label="Subkegiatan">
                  <div className="font-semibold text-pbd-navy">
                    {selectedItem.subkegiatan?.kode ?? "-"}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {selectedItem.subkegiatan?.nama ?? "-"}
                  </div>
                </DetailBlock>
                <DetailBlock label="Keterangan">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {selectedItem.keterangan || "-"}
                  </p>
                </DetailBlock>
                <DetailBlock label="Dokumen">
                  <FileList files={selectedItem.dokumen ?? []} />
                </DetailBlock>
              </div>
              <DetailBlock label="Foto Dokumentasi">
                <PhotoGrid files={selectedItem.fotoDokumentasi ?? []} />
              </DetailBlock>
            </div>
          </DialogContent>
        ) : null}

        {dialogMode === "foto" && selectedItem ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Foto Dokumentasi</DialogTitle>
              <DialogDescription>{selectedItem.nama}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="foto">Foto realisasi</Label>
              <Input
                id="foto"
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => setPhotoFiles(event.target.files)}
                className="h-11 rounded-lg"
              />
            </div>
            {error ? <DialogError message={error} /> : null}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={saving}>
                  <X className="h-4 w-4" />
                  Batal
                </Button>
              </DialogClose>
              <Button
                type="button"
                onClick={handleUploadFoto}
                disabled={saving}
                className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
              >
                <ImageUp className="h-4 w-4" />
                {saving ? "Mengupload..." : "Upload Foto"}
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}

        {dialogMode === "dokumen" && selectedItem ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Dokumen</DialogTitle>
              <DialogDescription>
                Upload TOR, laporan, dan dokumen pendukung lain dalam bentuk PDF.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="dokumen">Dokumen PDF</Label>
              <Input
                id="dokumen"
                type="file"
                accept="application/pdf,.pdf"
                multiple
                onChange={(event) => setDocumentFiles(event.target.files)}
                className="h-11 rounded-lg"
              />
            </div>
            {error ? <DialogError message={error} /> : null}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={saving}>
                  <X className="h-4 w-4" />
                  Batal
                </Button>
              </DialogClose>
              <Button
                type="button"
                onClick={handleUploadDokumen}
                disabled={saving}
                className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
              >
                <FileUp className="h-4 w-4" />
                {saving ? "Mengupload..." : "Upload Dokumen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

function DialogError({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
      {message}
    </div>
  );
}

function DetailBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function PhotoGrid({ files }: { files: RealisasiFile[] }) {
  if (files.length === 0) {
    return <p className="text-sm text-slate-500">Foto belum tersedia.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {files.map((file) => (
        <a
          key={file.id}
          href={assetUrl(file.url)}
          target="_blank"
          rel="noreferrer"
          className="group overflow-hidden rounded-lg border border-slate-200"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetUrl(file.url)}
            alt={file.originalName}
            className="h-36 w-full object-cover transition group-hover:scale-105"
          />
          <div className="truncate px-3 py-2 text-xs font-medium text-slate-600">
            {file.originalName}
          </div>
        </a>
      ))}
    </div>
  );
}

function FileList({ files }: { files: RealisasiFile[] }) {
  if (files.length === 0) {
    return <p className="text-sm text-slate-500">Dokumen belum tersedia.</p>;
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <a
          key={file.id}
          href={assetUrl(file.url)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
        >
          <span className="truncate font-medium text-pbd-navy">
            {file.originalName}
          </span>
          <span className="shrink-0 text-xs text-slate-500">
            {formatFileSize(file.size)}
          </span>
        </a>
      ))}
    </div>
  );
}
