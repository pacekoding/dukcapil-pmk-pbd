"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Download,
  Eye,
  FileBadge2,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UsersRound,
} from "lucide-react";

import { ConfirmDeleteDialog } from "@/components/dashboard/confirm-delete-dialog";
import { formatDate, formatFileSize } from "@/components/dashboard/document-utils";
import { PageHero } from "@/components/dashboard/page-hero";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteMacekuArchive,
  getMacekuPKKDetail,
  updateMacekuArchive,
  uploadMacekuArchive,
} from "@/lib/api/maceku-pkk";
import { apiEndpoints } from "@/lib/api/endpoints";
import {
  normalizeBackendAssetUrl,
  withInlineBackendAssetDisposition,
} from "@/lib/api/assets";
import {
  ARCHIVE_FILE_ACCEPT,
  validateClientUpload,
} from "@/lib/api/file-policy";
import {
  macekuArchiveCategories,
  type MacekuPKKArchive,
  type MacekuPKKArchiveCategory,
  type MacekuPKKProfileDetail,
} from "@/types/maceku-pkk";

type ArchiveForm = {
  title: string;
  category: MacekuPKKArchiveCategory;
  documentYear: string;
  documentNumber: string;
  documentDate: string;
  description: string;
};

const emptyArchiveForm: ArchiveForm = {
  title: "",
  category: "Program Kerja",
  documentYear: "",
  documentNumber: "",
  documentDate: "",
  description: "",
};

export function MacekuPkkDetailClient({ id }: { id: string }) {
  const profileId = Number(id);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<MacekuPKKProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [archiveQuery, setArchiveQuery] = useState("");
  const [archiveCategory, setArchiveCategory] = useState("");
  const [archiveYear, setArchiveYear] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [form, setForm] = useState<ArchiveForm>(emptyArchiveForm);
  const [uploading, setUploading] = useState(false);
  const [editTarget, setEditTarget] = useState<MacekuPKKArchive | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MacekuPKKArchive | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!Number.isFinite(profileId) || profileId <= 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await getMacekuPKKDetail(profileId);
        if (mounted) {
          setProfile(response);
          setError(null);
        }
      } catch (loadError) {
        console.error(loadError);
        if (mounted) {
          setProfile(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Detail profil PKK gagal dimuat.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [profileId]);

  const filteredArchives = useMemo(() => {
    if (!profile) {
      return [];
    }

    return profile.archives.filter((archive) => {
      const matchesQuery = [archive.title, archive.documentNumber, archive.description]
        .join(" ")
        .toLowerCase()
        .includes(archiveQuery.trim().toLowerCase());
      const matchesCategory = !archiveCategory || archive.category === archiveCategory;
      const matchesYear = !archiveYear || archive.documentYear === archiveYear;
      return matchesQuery && matchesCategory && matchesYear;
    });
  }, [archiveCategory, archiveQuery, archiveYear, profile]);

  const archiveYears = useMemo(
    () =>
      Array.from(
        new Set(
          (profile?.archives ?? [])
            .map((archive) => archive.documentYear)
            .filter(Boolean),
        ),
      ).sort((left, right) => right.localeCompare(left)),
    [profile],
  );

  const resetUploadForm = () => {
    setForm(emptyArchiveForm);
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    setFileError(null);
    if (!file) {
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
    if (!profile || !selectedFile) {
      setFileError("File arsip wajib dipilih.");
      return;
    }
    if (fileError) {
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const archive = await uploadMacekuArchive(profile.id, {
        file: selectedFile,
        ...form,
      });
      setProfile((current) =>
        current
          ? {
              ...current,
              documentCount: current.documentCount + 1,
              archives: [archive, ...current.archives],
            }
          : current,
      );
      setMessage(`${archive.title} berhasil diupload.`);
      setUploadOpen(false);
      resetUploadForm();
    } catch (uploadError) {
      console.error(uploadError);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Arsip PKK gagal diupload.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSaveMetadata = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile || !editTarget) {
      return;
    }

    setSavingEdit(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateMacekuArchive(profile.id, editTarget.id, form);
      setProfile((current) =>
        current
          ? {
              ...current,
              archives: current.archives.map((archive) =>
                archive.id === updated.id ? updated : archive,
              ),
            }
          : current,
      );
      setMessage(`${updated.title} berhasil diperbarui.`);
      setEditTarget(null);
      setForm(emptyArchiveForm);
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Metadata arsip gagal diperbarui.",
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteArchive = async () => {
    if (!profile || !deleteTarget) {
      return;
    }

    setDeleting(true);
    setError(null);
    setMessage(null);
    try {
      await deleteMacekuArchive(profile.id, deleteTarget.id);
      setProfile((current) =>
        current
          ? {
              ...current,
              documentCount: Math.max(0, current.documentCount - 1),
              archives: current.archives.filter((archive) => archive.id !== deleteTarget.id),
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
          : "Arsip PKK gagal dihapus.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const openEditMetadata = (archive: MacekuPKKArchive) => {
    setEditTarget(archive);
    setForm({
      title: archive.title,
      category: archive.category,
      documentYear: archive.documentYear,
      documentNumber: archive.documentNumber,
      documentDate: archive.documentDate,
      description: archive.description,
    });
  };

  if (loading) {
    return (
      <main className="space-y-6">
        <PageHero
          icon={UsersRound}
          eyebrow="MACEKU PKK"
          title="Memuat profil PKK"
          description="Mengambil informasi organisasi dan arsip PKK dari server."
        />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="space-y-6">
        <PageHero
          icon={UsersRound}
          eyebrow="MACEKU PKK"
          title="Profil PKK tidak ditemukan"
          description="Data profil tidak tersedia atau sudah dihapus."
          aside={
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link href="/maceku-pkk/data">
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
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/portal" className="hover:text-pbd-navy">
          Portal
        </Link>
        <span>/</span>
        <Link href="/maceku-pkk/dashboard" className="hover:text-pbd-navy">
          MACEKU PKK
        </Link>
        <span>/</span>
        <Link href="/maceku-pkk/data" className="hover:text-pbd-navy">
          Profil PKK
        </Link>
        <span>/</span>
        <span className="font-medium text-pbd-navy">{profile.name}</span>
      </div>

      <PageHero
        icon={UsersRound}
        eyebrow="Detail Profil PKK"
        title={profile.name}
        description={formatRegion(profile.kabupatenKota, profile.distrik, profile.kampung)}
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge className="h-8 rounded-full bg-teal-50 px-4 text-sm font-bold text-teal-700">
              {profile.level}
            </Badge>
            <Badge
              className={
                profile.isActive
                  ? "h-8 rounded-full border border-emerald-100 bg-emerald-50 px-4 text-sm font-bold text-emerald-700"
                  : "h-8 rounded-full border border-slate-200 bg-slate-100 px-4 text-sm font-bold text-slate-600"
              }
            >
              {profile.isActive ? "Aktif" : "Nonaktif"}
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
              Unggah Arsip
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link href="/maceku-pkk/data">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Link>
            </Button>
          </div>
        }
      />

      {message ? <SuccessState message={message} /> : null}
      {error ? <ErrorState message={error} /> : null}

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <SectionCard title="Logo / Foto PKK" description="Identitas visual organisasi.">
          {profile.logoOriginalName ? (
            <div className="space-y-4">
              <Image
                src={normalizeBackendAssetUrl(
                  profile.logoPreviewUrl || apiEndpoints.macekuPkkLogo(profile.id),
                )}
                alt={profile.name}
                width={640}
                height={420}
                unoptimized
                className="h-64 w-full rounded-xl border border-teal-100 object-cover"
              />
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p className="font-semibold text-pbd-navy">{profile.logoOriginalName}</p>
                <p>{formatFileSize(profile.logoSize)}</p>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={ImageIcon}
              title="Belum ada logo PKK"
              description="Logo atau foto organisasi belum diunggah untuk profil ini."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Informasi Organisasi"
          description="Data utama organisasi PKK dan kontak sekretariat."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <InfoItem label="Kabupaten/Kota" value={profile.kabupatenKota} />
            <InfoItem label="Kecamatan/Distrik" value={profile.distrik || "-"} />
            <InfoItem label="Desa/Kampung" value={profile.kampung || "-"} />
            <InfoItem label="Periode Kepengurusan" value={profile.managementPeriod || "-"} />
            <InfoItem label="Ketua" value={profile.chairperson || "-"} />
            <InfoItem label="Sekretaris" value={profile.secretary || "-"} />
            <InfoItem label="Telepon" value={profile.phone || "-"} />
            <InfoItem label="Email" value={profile.email || "-"} />
            <InfoItem
              label="Alamat Sekretariat"
              value={profile.secretariatAddress || "-"}
              className="md:col-span-2"
            />
            <InfoItem
              label="Deskripsi"
              value={profile.description || "-"}
              className="md:col-span-2"
            />
          </div>
        </SectionCard>
      </section>

      {uploadOpen ? (
        <SectionCard
          title="Unggah Arsip PKK"
          description="File akan ditautkan langsung ke profil organisasi PKK ini."
        >
          <form onSubmit={(event) => void handleUpload(event)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-bold text-pbd-navy">File Arsip</span>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept={ARCHIVE_FILE_ACCEPT}
                  disabled={uploading}
                  onChange={(event) =>
                    handleFileChange(event.target.files?.[0] ?? null)
                  }
                />
                {selectedFile ? (
                  <p className="text-sm text-slate-500">
                    {selectedFile.name} · {formatFileSize(selectedFile.size)}
                  </p>
                ) : null}
                {fileError ? <p className="text-sm font-medium text-red-600">{fileError}</p> : null}
              </label>
              <FormInput
                label="Judul Dokumen"
                value={form.title}
                placeholder="Contoh: Program Kerja PKK 2026"
                onChange={(value) => setForm((current) => ({ ...current, title: value }))}
              />
              <SelectField
                label="Kategori Arsip"
                value={form.category}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    category: value as MacekuPKKArchiveCategory,
                  }))
                }
                options={macekuArchiveCategories}
              />
              <FormInput
                label="Tahun Dokumen"
                value={form.documentYear}
                placeholder="Contoh: 2026"
                onChange={(value) =>
                  setForm((current) => ({ ...current, documentYear: value }))
                }
              />
              <FormInput
                label="Nomor Dokumen"
                value={form.documentNumber}
                placeholder="Contoh: 01/PKK/VII/2026"
                onChange={(value) =>
                  setForm((current) => ({ ...current, documentNumber: value }))
                }
              />
              <label className="grid gap-2">
                <span className="text-sm font-bold text-pbd-navy">Tanggal Dokumen</span>
                <Input
                  type="date"
                  value={form.documentDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, documentDate: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-bold text-pbd-navy">Keterangan</span>
                <Textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="Tulis keterangan tambahan jika diperlukan"
                />
              </label>
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
              <Button
                type="submit"
                disabled={uploading}
                className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mengunggah...
                  </>
                ) : (
                  "Simpan Arsip"
                )}
              </Button>
            </div>
          </form>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Arsip PKK"
        description="Filter dokumen berdasarkan judul, kategori, dan tahun dokumen."
        action={
          <div className="grid w-full gap-3 md:grid-cols-3">
            <Input
              value={archiveQuery}
              onChange={(event) => setArchiveQuery(event.target.value)}
              placeholder="Cari judul arsip..."
            />
            <select
              value={archiveCategory}
              onChange={(event) => setArchiveCategory(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Semua kategori</option>
              {macekuArchiveCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              value={archiveYear}
              onChange={(event) => setArchiveYear(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Semua tahun</option>
              {archiveYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        }
        contentClassName="p-0"
      >
        {filteredArchives.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul Dokumen</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Tahun</TableHead>
                <TableHead>Ukuran</TableHead>
                <TableHead>Diunggah Oleh</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArchives.map((archive) => (
                <TableRow key={archive.id}>
                  <TableCell className="min-w-[260px] whitespace-normal">
                    <p className="font-semibold text-pbd-navy">{archive.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {archive.documentNumber || archive.originalName}
                    </p>
                  </TableCell>
                  <TableCell>{archive.category}</TableCell>
                  <TableCell>{archive.documentYear || "-"}</TableCell>
                  <TableCell>{formatFileSize(archive.fileSize)}</TableCell>
                  <TableCell className="whitespace-normal">
                    {archive.uploadedByName || "-"}
                    <span className="mt-1 block text-xs text-slate-500">
                      {formatDate(archive.uploadedAt)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <a
                          href={withInlineBackendAssetDisposition(
                            archive.previewUrl ||
                              apiEndpoints.macekuPkkArchivePreview(profile.id, archive.id),
                          )}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Eye className="h-4 w-4" />
                          Lihat
                        </a>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <a
                          href={
                            archive.downloadUrl ||
                            apiEndpoints.macekuPkkArchiveDownload(profile.id, archive.id)
                          }
                        >
                          <Download className="h-4 w-4" />
                          Unduh
                        </a>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openEditMetadata(archive)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteTarget(archive)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={FileBadge2}
              title="Belum ada arsip PKK"
              description="Unggah dokumen pertama atau ubah filter pencarian arsip."
            />
          </div>
        )}
      </SectionCard>

      <Dialog open={Boolean(editTarget)} onOpenChange={() => setEditTarget(null)}>
        <DialogContent>
          <form onSubmit={(event) => void handleSaveMetadata(event)} className="space-y-5">
            <DialogHeader>
              <DialogTitle>Edit Metadata Arsip</DialogTitle>
              <DialogDescription>
                Perbarui judul, kategori, tahun, nomor, tanggal, dan keterangan arsip PKK.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="Judul Dokumen"
                value={form.title}
                placeholder="Judul dokumen"
                onChange={(value) => setForm((current) => ({ ...current, title: value }))}
              />
              <SelectField
                label="Kategori Arsip"
                value={form.category}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    category: value as MacekuPKKArchiveCategory,
                  }))
                }
                options={macekuArchiveCategories}
              />
              <FormInput
                label="Tahun Dokumen"
                value={form.documentYear}
                placeholder="2026"
                onChange={(value) =>
                  setForm((current) => ({ ...current, documentYear: value }))
                }
              />
              <FormInput
                label="Nomor Dokumen"
                value={form.documentNumber}
                placeholder="Nomor dokumen"
                onChange={(value) =>
                  setForm((current) => ({ ...current, documentNumber: value }))
                }
              />
              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-bold text-pbd-navy">Tanggal Dokumen</span>
                <Input
                  type="date"
                  value={form.documentDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, documentDate: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-bold text-pbd-navy">Keterangan</span>
                <Textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                />
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={savingEdit}
                className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
              >
                {savingEdit ? "Menyimpan..." : "Simpan Metadata"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Hapus arsip PKK?"
        description={`Arsip ${deleteTarget?.title ?? "dokumen"} akan dihapus permanen.`}
        loading={deleting}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={handleDeleteArchive}
      />
    </main>
  );
}

function InfoItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        {value}
      </div>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-pbd-navy">{label}</span>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-pbd-navy">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function formatRegion(kabupatenKota: string, distrik: string, kampung: string) {
  return [kabupatenKota, distrik, kampung].filter(Boolean).join(" / ");
}
