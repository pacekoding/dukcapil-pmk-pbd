"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  Camera,
  Download,
  Edit3,
  Eye,
  FileText,
  GraduationCap,
  IdCard,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";

import { EmployeePhoto } from "@/components/arsipku/employee-photo";
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
import { Switch } from "@/components/ui/switch";
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
  updateArsipPegawai,
  updatePegawaiDocumentMetadata,
  uploadArsipPegawaiPhoto,
  uploadPegawaiDocument,
} from "@/lib/api/arsipku";
import { apiEndpoints } from "@/lib/api/endpoints";
import { withInlineBackendAssetDisposition } from "@/lib/api/assets";
import {
  ARCHIVE_FILE_ACCEPT,
  IMAGE_FILE_ACCEPT,
  validateClientUpload,
} from "@/lib/api/file-policy";
import { cn } from "@/lib/utils";
import type {
  ArsipBidang,
  PegawaiArchive,
  PegawaiArchivePayload,
  PegawaiDocument,
  PegawaiDocumentCategory,
} from "@/types/arsipku";

const documentCategories: PegawaiDocumentCategory[] = [
  "SK CPNS",
  "SK PNS",
  "SPMT",
  "Ijazah",
  "KTP",
  "Sertifikat",
];
const metadataDocumentCategories: PegawaiDocumentCategory[] = [
  ...documentCategories,
  "SK",
  "Lainnya",
];

type UploadForm = {
  title: string;
  category: PegawaiDocumentCategory;
  year: string;
};

type MetadataForm = {
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
  const documentTitleInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [pegawai, setPegawai] = useState<PegawaiArchive | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [form, setForm] = useState<UploadForm>(() => createEmptyUploadForm());
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PegawaiDocument | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [metadataTarget, setMetadataTarget] =
    useState<PegawaiDocument | null>(null);
  const [metadataForm, setMetadataForm] = useState<MetadataForm>(() =>
    createEmptyMetadataForm(),
  );
  const [updatingMetadata, setUpdatingMetadata] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<PegawaiArchivePayload | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    if (!uploadOpen) {
      return;
    }
    window.requestAnimationFrame(() => {
      documentTitleInputRef.current?.focus();
      documentTitleInputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, [uploadOpen]);

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
      if (metadataTarget?.id === deleteTarget.id) {
        setMetadataTarget(null);
      }
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

  const startMetadataEdit = (document: PegawaiDocument) => {
    setMetadataTarget(document);
    setMetadataForm({
      title: document.title,
      category: document.category,
      number: document.number,
      year: document.year,
      bidang: document.bidang,
      status: document.status,
    });
    setError(null);
    setMessage(null);
  };

  const handleUpdateMetadata = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!pegawai || !metadataTarget) {
      return;
    }

    setUpdatingMetadata(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await updatePegawaiDocumentMetadata(
        pegawai.id,
        metadataTarget.id,
        metadataForm,
      );
      setPegawai((current) =>
        current
          ? {
              ...current,
              documents: current.documents.map((document) =>
                document.id === updated.id ? updated : document,
              ),
            }
          : current,
      );
      setMessage(`Metadata ${updated.title} berhasil diperbarui.`);
      setMetadataTarget(null);
    } catch (updateError) {
      console.error(updateError);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Metadata dokumen gagal diperbarui.",
      );
    } finally {
      setUpdatingMetadata(false);
    }
  };

  const startEditing = () => {
    if (!pegawai) {
      return;
    }
    setEditForm(createEditForm(pegawai));
    setSelectedPhoto(null);
    setPhotoError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditForm(null);
    setSelectedPhoto(null);
    setPhotoError(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  const handlePhotoChange = (photo: File | null) => {
    setSelectedPhoto(photo);
    setPhotoError(null);
    if (!photo) {
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
      return;
    }

    try {
      validateClientUpload(photo, "image");
    } catch (validationError) {
      setPhotoError(
        validationError instanceof Error
          ? validationError.message
          : "Foto pegawai tidak valid.",
      );
    }
  };

  const updateEditField = <Key extends keyof PegawaiArchivePayload>(
    key: Key,
    value: PegawaiArchivePayload[Key],
  ) => {
    setEditForm((current) =>
      current ? { ...current, [key]: value } : current,
    );
  };

  const handleSaveEmployee = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!pegawai || !editForm || photoError) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      let updated = await updateArsipPegawai(pegawai.id, editForm);
      setPegawai(updated);
      if (selectedPhoto) {
        try {
          updated = await uploadArsipPegawaiPhoto(pegawai.id, selectedPhoto);
          setPegawai(updated);
        } catch (photoUploadError) {
          console.error(photoUploadError);
          setMessage("Data pegawai berhasil diperbarui tanpa foto baru.");
          setError(
            photoUploadError instanceof Error
              ? photoUploadError.message
              : "Foto pegawai gagal diunggah.",
          );
          cancelEditing();
          return;
        }
      }
      setMessage("Data pegawai berhasil diperbarui.");
      cancelEditing();
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Data pegawai gagal diperbarui.",
      );
    } finally {
      setSaving(false);
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
              <Link href="/arsipku/data-pegawai">
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
            <Badge
              className={cn(
                "h-8 rounded-full px-4 text-sm font-bold",
                pegawai.status === "Aktif"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600",
              )}
            >
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
            {!editing ? (
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                onClick={startEditing}
              >
                <Edit3 className="h-4 w-4" />
                Edit Data
              </Button>
            ) : null}
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link href="/arsipku/data-pegawai">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Link>
            </Button>
          </div>
        }
      />

      {message ? <SuccessState message={message} /> : null}
      {error ? <ErrorState message={error} /> : null}

      {editing && editForm ? (
        <form
          onSubmit={(event) => void handleSaveEmployee(event)}
          className="space-y-4"
        >
          <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <SectionCard
              title="Foto Pegawai"
              description="Unggah foto JPG, PNG, atau WebP."
            >
              <div className="space-y-4">
                <EmployeePhoto
                  employee={pegawai}
                  className="mx-auto aspect-[3/4] w-full max-w-[220px] rounded-lg text-5xl"
                  sizes="220px"
                />
                <div className="grid gap-2">
                  <Label htmlFor="pegawai-photo">Ganti Foto</Label>
                  <Input
                    ref={photoInputRef}
                    id="pegawai-photo"
                    type="file"
                    accept={IMAGE_FILE_ACCEPT}
                    disabled={saving}
                    onChange={(event) =>
                      handlePhotoChange(event.target.files?.[0] ?? null)
                    }
                  />
                  {selectedPhoto ? (
                    <div
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-lg border px-3 py-3 text-sm",
                        photoError
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-slate-200 bg-slate-50 text-slate-600",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Camera className="h-5 w-5 shrink-0" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {selectedPhoto.name}
                          </p>
                          <p className="text-xs">
                            {formatFileSize(selectedPhoto.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={saving}
                        onClick={() => handlePhotoChange(null)}
                        aria-label="Hapus foto yang dipilih"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : pegawai.photoOriginalName ? (
                    <p className="text-sm text-slate-600">
                      Foto saat ini:{" "}
                      <span className="font-semibold">
                        {pegawai.photoOriginalName}
                      </span>
                    </p>
                  ) : null}
                  {photoError ? (
                    <p className="text-sm font-medium text-red-600">
                      {photoError}
                    </p>
                  ) : null}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Edit Data Pegawai"
              description="Semua perubahan disimpan langsung pada halaman detail."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <EmployeeFormInput
                  label="NIP"
                  value={editForm.nip}
                  onChange={(value) => updateEditField("nip", value)}
                />
                <EmployeeFormInput
                  label="NIK"
                  value={editForm.nik}
                  onChange={(value) => updateEditField("nik", value)}
                />
                <EmployeeFormInput
                  label="Nama"
                  value={editForm.name}
                  onChange={(value) => updateEditField("name", value)}
                />
                <EmployeeFormInput
                  label="Tempat Lahir"
                  value={editForm.birthPlace}
                  required={false}
                  onChange={(value) => updateEditField("birthPlace", value)}
                />
                <EmployeeFormInput
                  label="Tanggal Lahir"
                  value={editForm.birthDate}
                  type="date"
                  required={false}
                  onChange={(value) => updateEditField("birthDate", value)}
                />
                <EmployeeFormInput
                  label="Jabatan"
                  value={editForm.position}
                  onChange={(value) => updateEditField("position", value)}
                />
                <EmployeeFormInput
                  label="Bidang"
                  value={editForm.bidang}
                  onChange={(value) => updateEditField("bidang", value)}
                />
                <EmployeeFormInput
                  label="Seksi"
                  value={editForm.unit}
                  onChange={(value) => updateEditField("unit", value)}
                />
                <EmployeeFormInput
                  label="Pangkat/Golongan"
                  value={editForm.rank}
                  onChange={(value) => updateEditField("rank", value)}
                />
                <EmployeeFormInput
                  label="Email"
                  value={editForm.email}
                  onChange={(value) => updateEditField("email", value)}
                />
                <EmployeeFormInput
                  label="Telepon"
                  value={editForm.phone}
                  onChange={(value) => updateEditField("phone", value)}
                />
                <EmployeeFormInput
                  label="No Rekening"
                  value={editForm.bankAccount}
                  onChange={(value) => updateEditField("bankAccount", value)}
                />
                <div className="grid gap-2">
                  <span className="text-sm font-bold text-pbd-navy">
                    Status Pegawai
                  </span>
                  <div className="flex h-10 items-center justify-between rounded-md border border-input px-3">
                    <span className="text-sm font-semibold text-slate-700">
                      {editForm.status === "Aktif" ? "Aktif" : "Nonaktif"}
                    </span>
                    <Switch
                      checked={editForm.status === "Aktif"}
                      disabled={saving}
                      onCheckedChange={(checked) =>
                        updateEditField(
                          "status",
                          checked ? "Aktif" : "Nonaktif",
                        )
                      }
                      aria-label="Status aktif pegawai"
                    />
                  </div>
                </div>
                <EmployeeFormInput
                  label="Alamat"
                  value={editForm.address}
                  className="md:col-span-2"
                  onChange={(value) => updateEditField("address", value)}
                />
              </div>
            </SectionCard>
          </section>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={cancelEditing}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={saving || Boolean(photoError)}
              className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <SectionCard
            title="Foto Pegawai"
            description="Identitas visual pegawai."
          >
            <div className="flex flex-col items-center text-center">
              <EmployeePhoto
                employee={pegawai}
                className="aspect-[3/4] w-full max-w-[220px] rounded-lg text-5xl"
                sizes="220px"
              />
              <h2 className="mt-5 text-xl font-extrabold text-pbd-navy">
                {pegawai.name}
              </h2>
              <p className="mt-1 text-sm font-semibold text-pbd-blue">
                {pegawai.position}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {[pegawai.bidang, pegawai.unit].filter(Boolean).join(" • ") ||
                  "-"}
              </p>
            </div>
          </SectionCard>

          <SectionCard
            title="Biodata Pegawai"
            description="Data utama pegawai untuk kebutuhan arsip internal."
            action={
              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={startEditing}>
                  <Edit3 className="h-4 w-4" />
                  Edit Data
                </Button>
              </div>
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <InfoItem label="Nama" value={pegawai.name} icon={UserRound} />
              <InfoItem label="Status" value={pegawai.status} icon={BadgeCheck} />
              <InfoItem label="NIP" value={pegawai.nip} icon={IdCard} />
              <InfoItem label="NIK" value={pegawai.nik} icon={ShieldCheck} />
              <InfoItem
                label="Tempat Lahir"
                value={pegawai.birthPlace}
                icon={MapPin}
              />
              <InfoItem
                label="Tanggal Lahir"
                value={formatBirthDate(pegawai.birthDate)}
                icon={CalendarDays}
              />
              <InfoItem
                label="Jabatan"
                value={pegawai.position}
                icon={IdCard}
              />
              <InfoItem
                label="Bidang"
                value={pegawai.bidang}
                icon={Building2}
              />
              <InfoItem label="Seksi" value={pegawai.unit} icon={Building2} />
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
                icon={MapPin}
                className="md:col-span-2"
              />
            </div>
          </SectionCard>
        </section>
      )}

      {uploadOpen ? (
        <SectionCard
          title="Upload Dokumen Pegawai"
          description="Pilih file, isi nama dokumen, tahun dokumen, dan kategori arsip."
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
                inputRef={documentTitleInputRef}
                onChange={(value) =>
                  setForm((current) => ({ ...current, title: value }))
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

      {metadataTarget ? (
        <SectionCard
          title="Edit Metadata Dokumen"
          description={`Perbarui identitas arsip ${metadataTarget.storedFileName}. File asli tidak berubah.`}
        >
          <form
            onSubmit={(event) => void handleUpdateMetadata(event)}
            className="space-y-5"
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FormInput
                id="arsipku-edit-title"
                label="Nama Dokumen"
                value={metadataForm.title}
                placeholder="Contoh: SK Pangkat Terakhir"
                onChange={(value) =>
                  setMetadataForm((current) => ({
                    ...current,
                    title: value,
                  }))
                }
              />
              <FormInput
                id="arsipku-edit-year"
                label="Tahun Dokumen"
                value={metadataForm.year}
                placeholder="Contoh: 2026"
                onChange={(value) =>
                  setMetadataForm((current) => ({ ...current, year: value }))
                }
              />
              <DocumentSelectField
                label="Kategori"
                value={metadataForm.category}
                disabled={updatingMetadata}
                onValueChange={(value) =>
                  setMetadataForm((current) => ({
                    ...current,
                    category: value as PegawaiDocumentCategory,
                  }))
                }
                options={metadataDocumentCategories.map((category) => ({
                  value: category,
                  label: category,
                }))}
              />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={updatingMetadata}
                onClick={() => setMetadataTarget(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={updatingMetadata}
                className="bg-pbd-navy text-white hover:bg-pbd-navy/90"
              >
                {updatingMetadata ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Edit3 className="h-4 w-4" />
                )}
                {updatingMetadata ? "Menyimpan..." : "Simpan Metadata"}
              </Button>
            </div>
          </form>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Daftar File Arsip"
        description={`${documentCount} file tersimpan. ${needsVerification} file menunggu verifikasi. Gunakan menu Data Arsip untuk pencarian dan filter seluruh dokumen.`}
        contentClassName="p-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Dokumen</TableHead>
              <TableHead>Tahun Dokumen</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>File</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pegawai.documents.length > 0 ? (
              pegawai.documents.map((document) => (
                <DocumentTableRow
                  key={document.id}
                  pegawaiId={pegawai.id}
                  document={document}
                  onEdit={startMetadataEdit}
                  onDelete={setDeleteTarget}
                />
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
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

function DocumentTableRow({
  pegawaiId,
  document,
  onEdit,
  onDelete,
}: {
  pegawaiId: number;
  document: PegawaiDocument;
  onEdit: (document: PegawaiDocument) => void;
  onDelete: (document: PegawaiDocument) => void;
}) {
  return (
    <TableRow>
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
            <p className="font-bold text-pbd-navy">{document.title}</p>
            <p className="mt-1 text-xs text-slate-500">
              Upload {formatDate(document.uploadedAt)}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>{document.year || "-"}</TableCell>
      <TableCell>
        <Badge variant="outline" className="bg-slate-50">
          {document.category}
        </Badge>
      </TableCell>
      <TableCell className="min-w-[220px] whitespace-normal">
        <p className="font-medium text-pbd-navy">{document.storedFileName}</p>
        <p className="mt-1 text-xs text-slate-500">
          {document.fileType} • {formatFileSize(document.fileSize)}
        </p>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEdit(document)}
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </Button>
          <Button asChild type="button" variant="outline" size="sm">
            <a
              href={withInlineBackendAssetDisposition(
                document.previewUrl ??
                  apiEndpoints.arsipPegawaiDocumentDownload(
                    pegawaiId,
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
                pegawaiId,
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
            onClick={() => onDelete(document)}
          >
            <Trash2 className="h-4 w-4" />
            Hapus
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function DocumentSelectField({
  label,
  value,
  options,
  onValueChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onValueChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-pbd-navy">{label}</span>
      <Select
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
      >
        <SelectTrigger className="h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
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
  inputRef,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputRef?: Ref<HTMLInputElement>;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-pbd-navy">{label}</span>
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={label === "Nama Dokumen"}
      />
    </label>
  );
}

function EmployeeFormInput({
  label,
  value,
  onChange,
  type = "text",
  className,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
  required?: boolean;
}) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-sm font-bold text-pbd-navy">{label}</span>
      <Input
        value={value}
        type={type}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}

function createEditForm(pegawai: PegawaiArchive): PegawaiArchivePayload {
  return {
    nip: pegawai.nip,
    nik: pegawai.nik,
    name: pegawai.name,
    birthPlace: pegawai.birthPlace,
    birthDate: pegawai.birthDate,
    position: pegawai.position,
    bidang: pegawai.bidang,
    unit: pegawai.unit,
    rank: pegawai.rank,
    email: pegawai.email,
    phone: pegawai.phone,
    bankAccount: pegawai.bankAccount,
    address: pegawai.address,
    status: pegawai.status === "Aktif" ? "Aktif" : "Nonaktif",
    photoColor: pegawai.photoColor,
  };
}

function createEmptyUploadForm(): UploadForm {
  return {
    title: "",
    category: "SK CPNS",
    year: "",
  };
}

function createEmptyMetadataForm(): MetadataForm {
  return {
    title: "",
    category: "SK CPNS",
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

function formatBirthDate(value: string) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
