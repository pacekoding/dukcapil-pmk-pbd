"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { LucideIcon } from "lucide-react";
import { Edit, Eye, Loader2, MoreHorizontal, Plus, Trash2 } from "lucide-react";

import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { formatDate } from "@/components/dashboard/document-utils";
import { PageHero } from "@/components/dashboard/page-hero";
import { Pagination } from "@/components/dashboard/pagination";
import {
  PelaksanaanDocumentUploadDialog,
  PelaksanaanDocumentUploadForm,
} from "@/components/dashboard/pelaksanaan-document-upload-dialog";
import { SearchInput } from "@/components/dashboard/search-input";
import { SectionCard } from "@/components/dashboard/section-card";
import {
  EmptyState,
  ErrorState,
  SuccessState,
} from "@/components/dashboard/state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiEndpoints } from "@/lib/api/endpoints";
import {
  deletePelaksanaanDocument,
  getPelaksanaanDocuments,
  updatePelaksanaanDocument,
} from "@/lib/api/pelaksanaan-documents";
import { withInlineBackendAssetDisposition } from "@/lib/api/assets";
import { getSubkegiatan } from "@/lib/api/subkegiatan";
import { getCurrentTahunAnggaran } from "@/lib/tahun-anggaran";
import type {
  PelaksanaanDocument,
  PelaksanaanDocumentMeta,
} from "@/types/pelaksanaan-documents";
import type { Subkegiatan } from "@/types/subkegiatan";

const PAGE_SIZE = 10;

const emptyMeta: PelaksanaanDocumentMeta = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

type PelaksanaanDocumentsPageProps = {
  moduleName: string;
  icon: LucideIcon;
  title: string;
  description: string;
  tableTitle: string;
  emptyTitle: string;
  emptyDescription: string;
  sumberAplikasi: string;
  bidang: "sekretariat" | "dukcapil" | "pmk";
  subkegiatanPrefix: string;
  subkegiatanScopeLabel: string;
};

export function PelaksanaanDocumentsPage({
  moduleName,
  icon,
  title,
  description,
  tableTitle,
  emptyTitle,
  emptyDescription,
  sumberAplikasi,
  bidang,
  subkegiatanPrefix,
  subkegiatanScopeLabel,
}: PelaksanaanDocumentsPageProps) {
  const [documents, setDocuments] = useState<PelaksanaanDocument[]>([]);
  const [meta, setMeta] = useState(emptyMeta);
  const [tahunAnggaran, setTahunAnggaran] = useState(getCurrentTahunAnggaran);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [desktopUploadOpen, setDesktopUploadOpen] = useState(false);
  const [editingDocument, setEditingDocument] =
    useState<PelaksanaanDocument | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PelaksanaanDocument | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        const result = await response.json();
        if (mounted && result.tahunAnggaran) {
          setTahunAnggaran(result.tahunAnggaran);
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

  useEffect(() => {
    let mounted = true;

    const loadDocuments = async () => {
      setLoading(true);
      try {
        const response = await getPelaksanaanDocuments({
          search: query,
          sumberAplikasi,
          bidang,
          subkegiatanPrefix,
          page,
          limit: PAGE_SIZE,
        });
        if (mounted) {
          setDocuments(Array.isArray(response.data) ? response.data : []);
          setMeta({ ...emptyMeta, ...response.meta });
          setError(null);
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setDocuments([]);
          setMeta({ ...emptyMeta, page });
          setError("Dokumen pelaksanaan gagal dimuat.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadDocuments();

    return () => {
      mounted = false;
    };
  }, [query, page, reloadKey, sumberAplikasi, bidang, subkegiatanPrefix]);

  const handleUploadSuccess = (document: PelaksanaanDocument) => {
    setMessage(`${document.nama || "Dokumen"} berhasil diupload.`);
    setError(null);
    setUploadOpen(false);
    setDesktopUploadOpen(false);
    setPage(1);
    setReloadKey((current) => current + 1);
  };

  const handleUpdateSuccess = (document: PelaksanaanDocument) => {
    setMessage(`${document.nama || "Dokumen"} berhasil diperbarui.`);
    setError(null);
    setEditingDocument(null);
    setReloadKey((current) => current + 1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setError(null);
    setMessage(null);
    try {
      await deletePelaksanaanDocument(deleteTarget.id);
      setMessage(`${deleteTarget.nama || "Dokumen"} berhasil dihapus.`);
      setDeleteTarget(null);
      setEditingDocument((current) =>
        current?.id === deleteTarget.id ? null : current,
      );
      setReloadKey((current) => current + 1);
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Dokumen pelaksanaan gagal dihapus.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHero
        icon={icon}
        eyebrow={moduleName}
        title={title}
        description={description}
        meta={
          <div className="flex flex-wrap gap-2">
            <p className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-pbd-blue">
              Tahun Anggaran {tahunAnggaran}
            </p>
            <p className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
              Subkegiatan {subkegiatanScopeLabel}
            </p>
          </div>
        }
        aside={
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              className="h-11 rounded-xl bg-pbd-navy text-white hover:bg-pbd-navy/90 md:hidden"
              onClick={() => setUploadOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Tambah Dokumen
            </Button>
            <Button
              type="button"
              className="hidden h-11 rounded-xl bg-pbd-navy text-white hover:bg-pbd-navy/90 md:inline-flex"
              disabled={desktopUploadOpen}
              onClick={() => setDesktopUploadOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Tambah Dokumen
            </Button>
          </div>
        }
      />

      {message ? <SuccessState message={message} /> : null}
      {error ? <ErrorState message={error} /> : null}

      {editingDocument ? (
        <SectionCard
          title="Edit Dokumen"
          description="Perbarui nama, subkegiatan, dan status DSSD dokumen pelaksanaan."
        >
          <PelaksanaanDocumentEditForm
            key={editingDocument.id}
            document={editingDocument}
            subkegiatanPrefix={subkegiatanPrefix}
            onCancel={() => setEditingDocument(null)}
            onSaved={handleUpdateSuccess}
          />
        </SectionCard>
      ) : null}

      {desktopUploadOpen ? (
        <SectionCard
          title="Tambah Dokumen"
          description="Lengkapi file dokumen pelaksanaan dan pilih subkegiatan yang sesuai."
          className="hidden md:block"
        >
          <PelaksanaanDocumentUploadForm
            active={desktopUploadOpen}
            idPrefix={`${moduleName.toLowerCase()}-dokumen-desktop`}
            onUploaded={handleUploadSuccess}
            onCompleted={() => setDesktopUploadOpen(false)}
            onCancel={() => setDesktopUploadOpen(false)}
            cancelLabel="Batal"
            sumberAplikasi={sumberAplikasi}
            bidang={bidang}
            subkegiatanPrefix={subkegiatanPrefix}
            subkegiatanRequired
          />
        </SectionCard>
      ) : null}

      <SectionCard contentClassName="p-0">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-bold text-pbd-navy">{tableTitle}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {meta.total} dokumen ditampilkan.
              </p>
            </div>
            <div className="lg:w-[420px]">
              <SearchInput
                value={query}
                onChange={(value) => {
                  setQuery(value);
                  setPage(1);
                }}
                placeholder="Cari nama atau subkegiatan..."
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto p-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[64px]">No</TableHead>
                <TableHead className="min-w-[260px]">Nama</TableHead>
                <TableHead className="min-w-[300px]">Subkegiatan</TableHead>
                <TableHead className="w-[160px]">Dokumen DSSD</TableHead>
                <TableHead className="w-[180px]">Tanggal Upload</TableHead>
                <TableHead className="w-[88px] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-slate-500"
                  >
                    Memuat dokumen pelaksanaan...
                  </TableCell>
                </TableRow>
              ) : documents.length > 0 ? (
                documents.map((document, index) => (
                  <TableRow key={document.id}>
                    <TableCell className="text-slate-500">
                      {(meta.page - 1) * meta.limit + index + 1}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <a
                        href={apiEndpoints.pelaksanaanDocumentDownload(
                          document.id,
                        )}
                        className="font-semibold text-pbd-navy hover:text-pbd-blue"
                      >
                        {document.nama}
                      </a>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {document.subkegiatanId ? (
                        <>
                          <div className="font-semibold text-slate-800">
                            {document.subkegiatanCode || "-"}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {document.subkegiatanName ||
                              "Subkegiatan tidak ditemukan"}
                          </div>
                        </>
                      ) : (
                        <span className="text-sm font-medium text-slate-500">
                          Tanpa subkegiatan
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          document.isDokumenDssd
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        }
                      >
                        {document.isDokumenDssd ? "Ya" : "Tidak"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">
                      {formatDate(document.tanggalUpload)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Aksi ${document.nama}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a
                              href={withInlineBackendAssetDisposition(
                                document.previewUrl ??
                                  apiEndpoints.pelaksanaanDocumentDownload(document.id),
                              )}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Eye className="h-4 w-4" />
                              Lihat
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setDesktopUploadOpen(false);
                              setEditingDocument(document);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeleteTarget(document)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-6">
                    <EmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                      icon={icon}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination
          page={meta.page}
          pageSize={meta.limit}
          total={meta.total}
          onPageChange={setPage}
        />
      </SectionCard>

      <PelaksanaanDocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploaded={handleUploadSuccess}
        sumberAplikasi={sumberAplikasi}
        bidang={bidang}
        subkegiatanPrefix={subkegiatanPrefix}
        subkegiatanRequired
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Hapus Dokumen Pelaksanaan"
        description={`Dokumen "${deleteTarget?.nama ?? "-"}" akan dihapus dari database dan file upload. Tindakan ini tidak dapat dibatalkan.`}
        loading={deleting}
        confirmLabel="Hapus Dokumen"
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}

type PelaksanaanDocumentEditFormProps = {
  document: PelaksanaanDocument;
  subkegiatanPrefix: string;
  onCancel: () => void;
  onSaved: (document: PelaksanaanDocument) => void;
};

function PelaksanaanDocumentEditForm({
  document,
  subkegiatanPrefix,
  onCancel,
  onSaved,
}: PelaksanaanDocumentEditFormProps) {
  const [subkegiatan, setSubkegiatan] = useState<Subkegiatan[]>([]);
  const [nama, setNama] = useState(document.nama);
  const [selectedSubkegiatanId, setSelectedSubkegiatanId] = useState(
    document.subkegiatanId ? String(document.subkegiatanId) : "",
  );
  const [isDokumenDssd, setIsDokumenDssd] = useState(document.isDokumenDssd);
  const [loadingSubkegiatan, setLoadingSubkegiatan] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadSubkegiatan = async () => {
      setLoadingSubkegiatan(true);
      try {
        const response = await getSubkegiatan({
          kodePrefix: subkegiatanPrefix,
        });
        if (mounted) {
          setSubkegiatan(Array.isArray(response.items) ? response.items : []);
          setError(null);
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setSubkegiatan([]);
          setError("Daftar subkegiatan gagal dimuat.");
        }
      } finally {
        if (mounted) {
          setLoadingSubkegiatan(false);
        }
      }
    };

    void loadSubkegiatan();

    return () => {
      mounted = false;
    };
  }, [subkegiatanPrefix]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nama.trim()) {
      setError("Nama dokumen wajib diisi.");
      return;
    }
    if (!selectedSubkegiatanId) {
      setError("Subkegiatan wajib dipilih.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await updatePelaksanaanDocument(document.id, {
        nama,
        subkegiatanId: selectedSubkegiatanId,
        isDokumenDssd,
      });
      onSaved(updated);
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Dokumen pelaksanaan gagal diperbarui.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
      {error ? <ErrorState message={error} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="edit-dokumen-nama">Nama</Label>
          <Input
            id="edit-dokumen-nama"
            value={nama}
            disabled={saving}
            onChange={(event) => setNama(event.target.value)}
            placeholder="Nama dokumen"
          />
        </div>

        <div className="grid gap-2">
          <Label>Subkegiatan</Label>
          <Select
            value={selectedSubkegiatanId}
            disabled={saving || loadingSubkegiatan}
            onValueChange={setSelectedSubkegiatanId}
          >
            <SelectTrigger className="h-11 rounded-lg">
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
      </div>

      <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
        <div>
          <Label htmlFor="edit-dokumen-dssd">Dokumen DSSD</Label>
          <p className="mt-1 text-xs text-slate-500">
            Tandai jika dokumen ini merupakan dokumen DSSD.
          </p>
        </div>
        <Switch
          id="edit-dokumen-dssd"
          checked={isDokumenDssd}
          disabled={saving}
          onCheckedChange={setIsDokumenDssd}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={onCancel}
        >
          Batal
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Simpan Perubahan
        </Button>
      </div>
    </form>
  );
}
