"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Download,
  Eye,
  FileText,
  GraduationCap,
  IdCard,
  Loader2,
  Mail,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";

import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { formatFileSize } from "@/components/dashboard/document-utils";
import { PageHero } from "@/components/dashboard/page-hero";
import { SectionCard } from "@/components/dashboard/section-card";
import { ErrorState, SuccessState } from "@/components/dashboard/state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  deletePegawaiDocument,
  getArsipPegawaiDetail,
  uploadPegawaiDocument,
} from "@/lib/api/arsip-pegawai";
import { apiEndpoints } from "@/lib/api/endpoints";
import { withInlineBackendAssetDisposition } from "@/lib/api/assets";
import {
  ARCHIVE_FILE_ACCEPT,
  validateClientUpload,
} from "@/lib/api/file-policy";
import { cn } from "@/lib/utils";
import type {
  ArsipBidang,
  PegawaiArchive,
  PegawaiDocument,
  PegawaiDocumentCategory,
} from "@/types/arsip-pegawai";

const documentCategories: PegawaiDocumentCategory[] = [
  "Ijazah",
  "SK",
  "SPMT",
  "Sertifikat",
  "Lainnya",
];
const bidangOptions: { value: ArsipBidang; label: string }[] = [
  { value: "sekretariat", label: "Sekretariat" },
  { value: "dukcapil", label: "Dukcapil" },
  { value: "pmk", label: "PMK" },
];

type UploadForm = {
  title: string;
  category: PegawaiDocumentCategory;
  number: string;
  year: string;
  bidang: ArsipBidang;
  status: PegawaiDocument["status"];
};

export function ArsipPegawaiDetailClient({ id }: { id: string }) {
  const pegawaiId = Number(id);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pegawai, setPegawai] = useState<PegawaiArchive | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [form, setForm] = useState<UploadForm>(() => createEmptyUploadForm());
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PegawaiDocument | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadPegawai = async () => {
      if (!Number.isFinite(pegawaiId) || pegawaiId <= 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const record = await getArsipPegawaiDetail(pegawaiId);
        if (mounted) {
          setPegawai(record);
          setError(null);
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setPegawai(null);
          setError("Detail pegawai gagal dimuat.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadPegawai();

    return () => {
      mounted = false;
    };
  }, [pegawaiId]);

  const documentCount = pegawai?.documents.length ?? 0;
  const needsVerification = useMemo(
    () =>
      pegawai?.documents.filter(
        (document) => document.status === "Perlu Verifikasi",
      ).length ?? 0,
    [pegawai],
  );

  const resetUploadForm = () => {
    setSelectedFile(null);
    setFileError(null);
    setForm(createEmptyUploadForm());
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    setFileError(null);
    if (!file) {
      setForm((current) => ({ ...current, title: "" }));
      return;
    }

    setForm((current) => ({
      ...current,
      title: current.title || file.name.replace(/\.[^/.]+$/, ""),
    }));

    try {
      validateClientUpload(file, "archive");
    } catch (validationError) {
      setFileError(
        validationError instanceof Error
          ? validationError.message
          : "File tidak valid.",
      );
    }
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pegawai) {
      return;
    }
    if (!selectedFile) {
      setFileError("File dokumen wajib diupload.");
      return;
    }
    if (fileError) {
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const document = await uploadPegawaiDocument(pegawai.id, {
        ...form,
        file: selectedFile,
      });
      setPegawai((current) =>
        current
          ? { ...current, documents: [document, ...current.documents] }
          : current,
      );
      setMessage(`${document.title} berhasil diupload.`);
      setUploadOpen(false);
      resetUploadForm();
    } catch (uploadError) {
      console.error(uploadError);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Dokumen pegawai gagal diupload.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!pegawai || !deleteTarget) {
      return;
    }

    setDeleting(true);
    setError(null);
    setMessage(null);
    try {
      await deletePegawaiDocument(pegawai.id, deleteTarget.id);
      setPegawai((current) =>
        current
          ? {
              ...current,
              documents: current.documents.filter(
                (document) => document.id !== deleteTarget.id,
              ),
            }
          : current,
      );
      setMessage(`${deleteTarget.title} berhasil dihapus.`);
      setDeleteTarget(null);
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Dokumen pegawai gagal dihapus.",
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="space-y-6">
        <PageHero
          icon={IdCard}
          eyebrow="Detail ARSIPKU"
          title="Memuat data pegawai"
          description="Mengambil biodata dan arsip dokumen pegawai dari server."
        />
      </main>
    );
  }

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
        {error ? <ErrorState message={error} /> : null}
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
          <div className="flex flex-wrap gap-2">
            <Badge className="h-8 rounded-full bg-emerald-50 px-4 text-sm font-bold text-emerald-700">
              {pegawai.status}
            </Badge>
            <Badge variant="outline" className="h-8 rounded-full px-4 text-sm">
              {documentCount} dokumen
            </Badge>
          </div>
        }
        aside={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="h-11 rounded-xl bg-pbd-navy text-white hover:bg-pbd-navy/90"
              onClick={() => setUploadOpen((current) => !current)}
            >
              <Plus className="h-4 w-4" />
              Upload Dokumen
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link href="/arsip-pegawai">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Link>
            </Button>
          </div>
        }
      />

      {message ? <SuccessState message={message} /> : null}
      {error ? <ErrorState message={error} /> : null}

      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <SectionCard title="Foto Pegawai" description="Identitas visual pegawai.">
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

      {uploadOpen ? (
        <SectionCard
          title="Upload Dokumen Pegawai"
          description="File disimpan ke tabel arsip dengan sumber ARSIPKU dan bidang yang dipilih."
        >
          <form onSubmit={(event) => void handleUpload(event)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="arsipku-file">File dokumen</Label>
                <Input
                  ref={fileInputRef}
                  id="arsipku-file"
                  type="file"
                  accept={ARCHIVE_FILE_ACCEPT}
                  disabled={uploading}
                  onChange={(event) =>
                    handleFileChange(event.target.files?.[0] ?? null)
                  }
                />
                {selectedFile ? (
                  <div
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg border px-3 py-3 text-sm",
                      fileError
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-slate-200 bg-slate-50 text-slate-600",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{selectedFile.name}</p>
                      <p className="text-xs">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={uploading}
                      onClick={() => handleFileChange(null)}
                      aria-label="Hapus file"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
                {fileError ? (
                  <p className="text-sm font-medium text-red-600">{fileError}</p>
                ) : null}
              </div>

              <FormInput
                id="arsipku-title"
                label="Nama Dokumen"
                value={form.title}
                placeholder="Contoh: SK Pangkat Terakhir"
                onChange={(value) =>
                  setForm((current) => ({ ...current, title: value }))
                }
              />
              <FormInput
                id="arsipku-number"
                label="Nomor Dokumen"
                value={form.number}
                placeholder="Contoh: SK/2026/001"
                onChange={(value) =>
                  setForm((current) => ({ ...current, number: value }))
                }
              />
              <FormInput
                id="arsipku-year"
                label="Tahun Dokumen"
                value={form.year}
                placeholder="Contoh: 2026"
                onChange={(value) =>
                  setForm((current) => ({ ...current, year: value }))
                }
              />
              <div className="grid gap-2">
                <Label>Kategori</Label>
                <Select
                  value={form.category}
                  disabled={uploading}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      category: value as PegawaiDocumentCategory,
                    }))
                  }
                >
                  <SelectTrigger className="h-11 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Bidang</Label>
                <Select
                  value={form.bidang}
                  disabled={uploading}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      bidang: value as ArsipBidang,
                    }))
                  }
                >
                  <SelectTrigger className="h-11 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bidangOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  disabled={uploading}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      status: value as PegawaiDocument["status"],
                    }))
                  }
                >
                  <SelectTrigger className="h-11 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lengkap">Lengkap</SelectItem>
                    <SelectItem value="Perlu Verifikasi">
                      Perlu Verifikasi
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => {
                  setUploadOpen(false);
                  resetUploadForm();
                }}
              >
                Batal
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>
          </form>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Daftar File Arsip"
        description={`${needsVerification} file menunggu verifikasi.`}
        contentClassName="p-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama File</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Bidang</TableHead>
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
                  <TableCell className="capitalize">{document.bidang}</TableCell>
                  <TableCell>{document.number || "-"}</TableCell>
                  <TableCell>{document.year || "-"}</TableCell>
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
                    <div className="flex justify-end gap-2">
                      <Button asChild type="button" variant="outline" size="sm">
                        <a
                          href={withInlineBackendAssetDisposition(
                            document.previewUrl ??
                              apiEndpoints.arsipPegawaiDocumentDownload(
                                pegawai.id,
                                document.id,
                              ),
                          )}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Eye className="h-4 w-4" />
                          Lihat
                        </a>
                      </Button>
                      <Button asChild type="button" variant="outline" size="sm">
                        <a
                          href={apiEndpoints.arsipPegawaiDocumentDownload(
                            pegawai.id,
                            document.id,
                          )}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </a>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget(document)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-sm font-medium text-slate-500"
                >
                  Belum ada file arsip untuk pegawai ini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Hapus Dokumen Arsip?"
        description={`Dokumen ${deleteTarget?.title ?? "pegawai"} akan dihapus dari Arsipku dan tabel arsip.`}
        loading={deleting}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={() => void handleDeleteDocument()}
      />
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
            {value || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}

function FormInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-pbd-navy">{label}</span>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={label === "Nama Dokumen"}
      />
    </label>
  );
}

function createEmptyUploadForm(): UploadForm {
  return {
    title: "",
    category: "Lainnya",
    number: "",
    year: "",
    bidang: "sekretariat",
    status: "Lengkap",
  };
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
